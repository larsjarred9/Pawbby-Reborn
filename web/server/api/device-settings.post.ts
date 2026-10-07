import prisma from '../utils/prisma'
import { buildSettingCommand, SETTING_KEYS, utcOffsetHoursFor } from '../utils/deviceSettings'

/**
 * Change a hardware setting on the litter box (DP 105 `deviceGate`).
 *
 * Body: { deviceId: string, setting: SettingKey, value?: any }
 *   auto_clean / soft_clumps / sleep_mode / auto_off_screen / child_lock  → boolean
 *   auto_clean_delay   → 1..60 (minutes)
 *   sleep_window       → { start: "HH:MM", stop: "HH:MM" }
 *   reset_deodorant    → (no value)
 *   weight_unit        → "kg" | "lb"
 *   sync_timezone      → UTC offset in whole hours (optional; defaults to the user's time zone)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { deviceId, setting } = body ?? {}
  let { value } = body ?? {}

  if (!deviceId || !setting) {
    throw createError({ statusCode: 400, statusMessage: 'Missing deviceId or setting' })
  }
  if (!SETTING_KEYS.includes(setting)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid setting. Allowed: ${SETTING_KEYS.join(', ')}` })
  }

  const device = await prisma.device.findUnique({ where: { id: String(deviceId) } })
  if (!device) throw createError({ statusCode: 404, statusMessage: 'Device not found' })

  if (setting === 'sync_timezone' && (value === undefined || value === null || value === '')) {
    const user = event.context.userId
      ? await prisma.user.findUnique({ where: { id: event.context.userId } })
      : await prisma.user.findFirst()
    try {
      value = utcOffsetHoursFor(user?.timezone || 'UTC')
    } catch {
      value = 0
    }
  }

  let command
  try {
    command = buildSettingCommand(setting, value)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e?.message || 'Invalid value' })
  }

  const result: { ok: boolean; error?: string } = { ok: false }
  const nitro = useNitroApp()
  await nitro.hooks.callHook('tuya:setting' as any, { deviceId: device.id, command, result })

  if (!result.ok) {
    throw createError({ statusCode: 503, statusMessage: result.error || 'Device is not reachable' })
  }

  return { success: true, setting: command.key, payload: command.payload, message: command.description }
})
