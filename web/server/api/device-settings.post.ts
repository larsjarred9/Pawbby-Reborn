import prisma from '../utils/prisma'
import { buildSettingCommand, SETTING_KEYS } from '../utils/deviceSettings'

/**
 * Change a hardware setting on the litter box (DP 105 `deviceGate`).
 *
 * Body: { deviceId: string, setting: SettingKey, value?: any }
 *   auto_clean / soft_clumps / sleep_mode / auto_off_screen / child_lock  → boolean
 *   auto_clean_delay   → 1..60 (minutes)
 *   sleep_window       → { start: "HH:MM", stop: "HH:MM" }
 *   reset_deodorant    → (no value)
 *   refresh            → (no value) ask the box to re-report its DP 103 snapshot (Tuya
 *                        DP_REFRESH, falling back to a time-zone push if the firmware ignores it)
 *
 * Weight unit and time zone are not settable here: they mirror the dashboard account
 * (user.weightUnit / user.timezone) and are synced to the box by the daemon.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { deviceId, setting } = body ?? {}
  const { value } = body ?? {}

  if (!deviceId || !setting) {
    throw createError({ statusCode: 400, statusMessage: 'Missing deviceId or setting' })
  }
  if (!SETTING_KEYS.includes(setting)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid setting. Allowed: ${SETTING_KEYS.join(', ')}` })
  }

  const device = await prisma.device.findUnique({ where: { id: String(deviceId) } })
  if (!device) throw createError({ statusCode: 404, statusMessage: 'Device not found' })

  if (setting === 'refresh') {
    // Pure read: ask the daemon to make the box re-report its DP 103 snapshot.
    const r: { ok: boolean; error?: string; method?: string } = { ok: false }
    await useNitroApp().hooks.callHook('tuya:refresh-settings' as any, { deviceId: device.id, result: r })
    if (!r.ok) throw createError({ statusCode: 503, statusMessage: r.error || 'Device is not reachable' })
    return { success: true, setting: 'refresh', method: r.method, message: `Settings refresh requested (${r.method})` }
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
