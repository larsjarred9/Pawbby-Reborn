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
    if (event.context.userRole !== "ADMIN") {
      throw createError({ statusCode: 403, statusMessage: "Only administrators can modify devices." });
    }

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
    const { id, name, mode, deviceId, ipAddress, localKey, tuyaClientId, tuyaClientSecret, tuyaRegion, deodorizerDuration, deodorizerLastReset } = body;
    if (!id) throw new Error("Device ID required for update");

    const safeData: any = {};
    
    // Only admins can modify core device connectivity/identity settings
    if (name !== undefined || mode !== undefined || deviceId !== undefined || ipAddress !== undefined || localKey !== undefined || tuyaClientId !== undefined || tuyaClientSecret !== undefined || tuyaRegion !== undefined) {
      if (event.context.userRole !== "ADMIN") {
        throw createError({ statusCode: 403, statusMessage: "Only administrators can modify core device settings." });
      }
      
      safeData.name = name;
      safeData.mode = mode;
      safeData.deviceId = deviceId;
      safeData.ipAddress = ipAddress;
      safeData.localKey = localKey;
      safeData.tuyaClientId = tuyaClientId;
      safeData.tuyaRegion = tuyaRegion;
      
      if (tuyaClientSecret && tuyaClientSecret !== '********') {
        safeData.tuyaClientSecret = tuyaClientSecret;
      }
    }

    // Both admins and standard users can reset the deodorizer pod
    if (deodorizerDuration !== undefined) safeData.deodorizerDuration = deodorizerDuration;
    if (deodorizerLastReset !== undefined) safeData.deodorizerLastReset = deodorizerLastReset;

    const device = await prisma.device.update({
      where: { id: String(id) },
      data: safeData,
    });

    // Restart daemon (only needed if core settings changed, but safe to call regardless)
    const nitro = useNitroApp();
    await nitro.hooks.callHook("tuya:restart" as any);
    await nitro.hooks.callHook("mqtt:refresh" as any);

    return { device };
  }

  if (method === "DELETE") {
    if (event.context.userRole !== "ADMIN") {
      throw createError({ statusCode: 403, statusMessage: "Only administrators can delete devices." });
    }

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
