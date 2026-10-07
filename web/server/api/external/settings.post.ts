import prisma from '../../utils/prisma'
import { buildSettingCommand, SETTING_KEYS } from '../../utils/deviceSettings'

/**
 * External (API-key) variant of /api/device-settings for Home Assistant & co.
 *
 * POST /api/external/settings
 * Authorization: Bearer <apiKey>
 * { "deviceId": "...", "setting": "auto_clean_delay", "value": 5 }
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Missing or invalid Authorization header. Provide token as Bearer <key>' })
  }

  const apiKey = authHeader.split(' ')[1]
  const user = await prisma.user.findFirst({ where: { apiKey } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid API Key' })
  }

  const body = await readBody(event)
  const { deviceId, setting } = body ?? {}
  const { value } = body ?? {}

  if (!deviceId || !setting) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing deviceId or setting in request body' })
  }
  if (!SETTING_KEYS.includes(setting)) {
    throw createError({ statusCode: 400, statusMessage: `Bad Request: Invalid setting. Allowed settings: ${SETTING_KEYS.join(', ')}` })
  }

  const device = await prisma.device.findUnique({ where: { id: String(deviceId) } })
  if (!device) throw createError({ statusCode: 404, statusMessage: `Device '${deviceId}' not found` })

  if (setting === 'refresh') {
    // Pure read: ask the daemon to make the box re-report its DP 103 snapshot.
    const r: { ok: boolean; error?: string; method?: string } = { ok: false }
    await useNitroApp().hooks.callHook('tuya:refresh-settings' as any, { deviceId: device.id, result: r })
    if (!r.ok) throw createError({ statusCode: 503, statusMessage: r.error || 'Device is not reachable' })
    return { success: true, setting: 'refresh', method: r.method, message: `Settings refresh requested from device '${device.id}' (${r.method})` }
  }

  let command
  try {
    command = buildSettingCommand(setting, value)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: `Bad Request: ${e?.message || 'Invalid value'}` })
  }

  const result: { ok: boolean; error?: string } = { ok: false }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('tuya:setting' as any, { deviceId: device.id, command, result })

  if (!result.ok) {
    throw createError({ statusCode: 503, statusMessage: result.error || 'Device is not reachable' })
  }

  return { success: true, setting: command.key, message: `${command.description} on device '${device.id}'` }
})
