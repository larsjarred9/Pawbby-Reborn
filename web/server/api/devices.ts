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

        let wasteBin = "Not Full*";
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
                // values.md: Byte[3] = clean cycle count
                if (buffer.length > 3) {
                  const cycleCount = buffer[3];
                  // Typically a bin is full around 10-15 cycles
                  if (cycleCount >= 13) {
                    wasteBin = "Full*";
                  } else {
                    wasteBin = `${Math.round((cycleCount / 13) * 100)}% Full*`;
                  }
                }
              }
            }
          } catch (e) {}
        }

        return {
          ...d,
          todayToileted,
          lastHeartbeat: latestRaw ? latestRaw.timestamp : null,
          wasteBin,
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
