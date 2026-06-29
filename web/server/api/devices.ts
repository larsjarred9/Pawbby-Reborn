import prisma from "../utils/prisma";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    const devices = await prisma.device.findMany();
    const devicesWithHeartbeat = await Promise.all(
      devices.map(async (d) => {
        const latestRaw = await prisma.litterEvent.findFirst({
          where: { deviceId: d.id, type: "tuya-raw-data" },
          orderBy: { timestamp: "desc" },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayToileted = await prisma.litterEvent.count({
          where: {
            deviceId: d.id,
            type: "toileted",
            timestamp: { gte: today },
          },
        });

        let wasteBin = "Normal";
        let litterLevel = "Sufficient*";
        let status = "Ready";
        let lidOpen = false;

        // Find the most recent raw data that contains DP 102 (clean cycle count/fault code)
        const latestDP102Event = await prisma.litterEvent.findFirst({
          where: {
            deviceId: d.id,
            type: "tuya-raw-data",
            rawData: { contains: '"102"' },
          },
          orderBy: { timestamp: "desc" },
        });

        if (latestDP102Event && latestDP102Event.rawData) {
          try {
            const parsed = JSON.parse(latestDP102Event.rawData);
            if (parsed && parsed.dps && parsed.dps["102"]) {
              const base64Str = parsed.dps["102"];
              if (typeof base64Str === "string") {
                const buffer = Buffer.from(base64Str, "base64");
                // If bytes 1 or 2 indicate a fault code, we can assume it's the insufficient litter error
                if (buffer.length > 2 && (buffer[1] > 0 || buffer[2] > 0)) {
                  litterLevel = "Insufficient*";
                }
              }
            }
          } catch (e) {}
        }

        // Check DP 114 for motor/sensor errors
        const latestDP114Event = await prisma.litterEvent.findFirst({
          where: {
            deviceId: d.id,
            type: "tuya-raw-data",
            rawData: { contains: '"114"' },
          },
          orderBy: { timestamp: "desc" },
        });
        if (latestDP114Event && latestDP114Event.rawData) {
          try {
            const parsed = JSON.parse(latestDP114Event.rawData);
            if (parsed && parsed.dps && parsed.dps["114"]) {
              const dp114 = String(parsed.dps["114"]).toLowerCase();
              if (dp114 !== "motor_ok") {
                litterLevel = "Insufficient*";
              }
            }
          } catch (e) {}
        }

        // Check DP 112 for low weight
        const latestDP112Event = await prisma.litterEvent.findFirst({
          where: {
            deviceId: d.id,
            type: "tuya-raw-data",
            rawData: { contains: '"112"' },
          },
          orderBy: { timestamp: "desc" },
        });
        if (latestDP112Event && latestDP112Event.rawData) {
          try {
            const parsed = JSON.parse(latestDP112Event.rawData);
            if (parsed && parsed.dps && parsed.dps["112"] !== undefined) {
              const weight = Number(parsed.dps["112"]);
              if (weight > 0 && weight < 1500) {
                litterLevel = "Insufficient*";
              }
            }
          } catch (e) {}
        }

        let binRemoved = false;

        // Check for persistent Bin Full state
        const latestCollectFull = await prisma.litterEvent.findFirst({
          where: {
            deviceId: d.id,
            type: "tuya-raw-data",
            rawData: { contains: '"collect_full"' },
          },
          orderBy: { timestamp: "desc" },
        });
        const latestBinReplaced = await prisma.litterEvent.findFirst({
          where: { deviceId: d.id, type: "bin-replaced" },
          orderBy: { timestamp: "desc" },
        });

        let isBinFullState = false;
        if (latestCollectFull) {
          const fullTime = latestCollectFull.timestamp.getTime();
          const replacedTime = latestBinReplaced
            ? latestBinReplaced.timestamp.getTime()
            : 0;
          if (fullTime > replacedTime) {
            isBinFullState = true;
          }
        }

        // Check DP 116 for status
        const latestDP116Event = await prisma.litterEvent.findFirst({
          where: {
            deviceId: d.id,
            type: "tuya-raw-data",
            rawData: { contains: '"116"' },
          },
          orderBy: { timestamp: "desc" },
        });
        if (latestDP116Event && latestDP116Event.rawData) {
          try {
            const parsed = JSON.parse(latestDP116Event.rawData);
            if (parsed && parsed.dps && parsed.dps["116"]) {
              const dp116 = String(parsed.dps["116"]);
              if (dp116 === "lid_open") {
                status = "Lid Open";
                lidOpen = true;
              } else if (dp116 === "collect_install") {
                status = "Bin Removed";
                binRemoved = true;
              } else if (dp116 === "collect_full") {
                status = "Bin Full";
                wasteBin = "Full";
              } else if (dp116 !== "work_idle") {
                status = "Busy";
              }
            }
          } catch (e) {}
        }

        // Override status if the bin is persistently full (and not currently removed or open)
        if (isBinFullState) {
          wasteBin = "Full";
          if (!lidOpen && !binRemoved && status === "Ready") {
            status = "Bin Full";
          }
        }

        return {
          ...d,
          status,
          lidOpen,
          binRemoved,
          todayToileted,
          lastHeartbeat: latestRaw ? latestRaw.timestamp : null,
          wasteBin,
          litterLevel,
        };
      }),
    );
    return { devices: devicesWithHeartbeat };
  }

  if (method === "POST") {
    const body = await readBody(event);

    // Create new device
    const device = await prisma.device.create({
      data: {
        name: body.name || "Smart Litter Box",
        mode: body.mode || "local",
        deviceId: body.deviceId,
        ipAddress: body.ipAddress,
        localKey: body.localKey,
        tuyaClientId: body.tuyaClientId,
        tuyaClientSecret: body.tuyaClientSecret,
        tuyaRegion: body.tuyaRegion,
      },
    });

    // Restart daemon
    const nitro = useNitroApp();
    await nitro.hooks.callHook("tuya:restart" as any);

    return { device };
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const { id, ...data } = body;
    if (!id) throw new Error("Device ID required for update");

    const device = await prisma.device.update({
      where: { id: String(id) },
      data,
    });

    // Restart daemon
    const nitro = useNitroApp();
    await nitro.hooks.callHook("tuya:restart" as any);

    return { device };
  }

  if (method === "DELETE") {
    const query = getQuery(event);
    if (query.id) {
      await prisma.device.delete({ where: { id: String(query.id) } });
      // Restart daemon
      const nitro = useNitroApp();
      await nitro.hooks.callHook("tuya:restart" as any);
      return { success: true };
    }
  }
});
