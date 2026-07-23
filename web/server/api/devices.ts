import prisma from "../utils/prisma";
import { computeDeviceState } from "../utils/deviceState";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    const devices = await prisma.device.findMany();
    const devicesWithHeartbeat = await Promise.all(
      devices.map(async (d) => {
        const state = await computeDeviceState(d);
        return {
          ...d,
          tuyaClientSecret: d.tuyaClientSecret ? '********' : null,
          ...state,
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
    await nitro.hooks.callHook("mqtt:refresh" as any);

    return { device };
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const { id, name, mode, deviceId, ipAddress, localKey, tuyaClientId, tuyaClientSecret, tuyaRegion, deodorizerDuration } = body;
    if (!id) throw new Error("Device ID required for update");

    const safeData: any = { name, mode, deviceId, ipAddress, localKey, tuyaClientId, tuyaRegion, deodorizerDuration };
    
    if (tuyaClientSecret && tuyaClientSecret !== '********') {
      safeData.tuyaClientSecret = tuyaClientSecret;
    }

    const device = await prisma.device.update({
      where: { id: String(id) },
      data: safeData,
    });

    // Restart daemon
    const nitro = useNitroApp();
    await nitro.hooks.callHook("tuya:restart" as any);
    await nitro.hooks.callHook("mqtt:refresh" as any);

    return { device };
  }

  if (method === "DELETE") {
    const query = getQuery(event);
    if (query.id) {
      await prisma.device.delete({ where: { id: String(query.id) } });
      // Restart daemon
      const nitro = useNitroApp();
      await nitro.hooks.callHook("tuya:restart" as any);
      await nitro.hooks.callHook("mqtt:refresh" as any);
      return { success: true };
    }
  }
});
