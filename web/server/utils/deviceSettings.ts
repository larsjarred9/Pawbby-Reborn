/**
 * Pawbby litter box settings codec.
 *
 * The box exposes its user settings on two raw Tuya datapoints
 * (see DP105_SETTINGS.md for the reverse-engineering notes):
 *
 *  - DP 103 `deviceStatus`  : read-only snapshot blob pushed by the device (every ~10 min and on each
 *                             state change). Carries all switches, the sleep window and the auto-clean delay.
 *  - DP 105 `deviceGate`    : write-only settings DP. Every command is
 *                             `01 <gate> <len:2 BE> <data>` encoded as base64.
 *
 * Everything here is pure (no I/O) so it can be unit-tested.
 */

export const DeviceGate = {
  AutoClear: 0x00,
  SoftClumps: 0x01, // "RBCompatible" in the vendor app
  Sleep: 0x02, // "Disturb" / Do-Not-Disturb
  AutoOffScreen: 0x03,
  ChildLock: 0x04,
  LitterType: 0x05,
  SetAutoClearTime: 0x06,
  SetDisturbTime: 0x07,
  ResetDeodorant: 0x08,
  SyncTimeZone: 0x09,
  SetWeightUnit: 0x0a,
} as const

export type DeviceGateId = (typeof DeviceGate)[keyof typeof DeviceGate]

export interface DeviceSettings {
  /** Device started the auto-clean countdown when a cat leaves */
  autoClean: boolean
  /** "Soft Clumps Mode": shake 2–4× before cleaning */
  softClumps: boolean
  /** Sleep mode / Do-Not-Disturb: pause auto-clean inside the window */
  sleepEnabled: boolean
  /** "HH:MM" local device time */
  sleepStart: string
  sleepStop: string
  /** Auto screen-off after 5 min idle */
  autoOffScreen: boolean
  /** Screen child lock */
  childLock: boolean
  /** Minutes to wait after the cat leaves before auto-cleaning (1–60) */
  autoCleanDelayMin: number
  /** Litter type index used for the litter-level estimate (see LITTER_TYPES) */
  litterType: number
  /** 0 = kg, 1 = lb as configured on the device */
  weightUnit: 'kg' | 'lb'
  /** 0 = empty, 1 = low, 2 = enough (firmware's own litter sensor) */
  litterLevelRaw: number
  /** Deodorant pod days remaining according to the firmware */
  deodorantDays: number
  /** Misc. live flags also carried in the blob */
  binFull: boolean
  binRemoved: boolean
  lidOpen: boolean
  catIn: boolean
  catNear: boolean
  catInLongTime: boolean
  /** Raw payload (base64) the snapshot was decoded from */
  raw: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Decode a DP 103 `deviceStatus` payload (base64) into a settings snapshot.
 * Returns null when the payload does not look like a settings blob.
 */
export function decodeDeviceStatus(base64: string): DeviceSettings | null {
  let buf: Buffer
  try {
    buf = Buffer.from(base64, 'base64')
  } catch {
    return null
  }
  // header: ver(1) cmd(1) len(2 BE)
  if (buf.length < 4 || buf[0] !== 0x01) return null
  const len = buf.readUInt16BE(2)
  const d = buf.subarray(4, 4 + len)
  // The vendor app reads up to byte 21; missing bytes are treated as 0 (the app
  // zero-pads short payloads too), but we need at least the settings region.
  if (d.length < 17) return null
  const b = (i: number): number => (i < d.length ? (d[i] ?? 0) : 0)

  return {
    binFull: b(0) === 1,
    binRemoved: b(1) === 1,
    lidOpen: b(2) === 1,
    weightUnit: b(3) === 1 ? 'lb' : 'kg',
    sleepStart: `${pad2(b(4))}:${pad2(b(5))}`,
    catIn: b(6) === 1,
    catNear: b(7) === 1,
    sleepStop: `${pad2(b(8))}:${pad2(b(9))}`,
    autoClean: b(10) !== 0,
    softClumps: b(11) !== 0,
    sleepEnabled: b(12) !== 0,
    autoOffScreen: b(13) !== 0,
    childLock: b(14) !== 0,
    litterType: b(15),
    autoCleanDelayMin: b(16),
    litterLevelRaw: b(17),
    deodorantDays: b(19),
    catInLongTime: b(20) === 1,
    raw: base64,
  }
}

/** Build a DP 105 frame: 01 <gate> <len:2> <data> → base64 */
export function encodeGateFrame(gate: DeviceGateId, data: number[] = []): string {
  for (const v of data) {
    if (!Number.isInteger(v) || v < 0 || v > 0xff) {
      throw new Error(`Gate payload byte out of range: ${v}`)
    }
  }
  const buf = Buffer.from([0x01, gate, (data.length >> 8) & 0xff, data.length & 0xff, ...data])
  return buf.toString('base64')
}

export const encodeToggle = (gate: DeviceGateId, on: boolean) => encodeGateFrame(gate, [on ? 1 : 0])

/**
 * Litter types known to the firmware (index = value sent on gate 5). The box uses the
 * litter density to estimate the remaining litter level, so this should match what is
 * actually in the drum.
 */
export const LITTER_TYPES = [
  { id: 0, name: 'Pawbby Natural Cat Litter', hint: 'Plant-based (recommended by the vendor)' },
  { id: 1, name: 'Tofu cat litter', hint: '' },
  { id: 2, name: 'Bentonite cat litter', hint: 'Clay' },
  { id: 3, name: 'Mixed cat litter', hint: 'Tofu + bentonite blend' },
] as const

export function encodeLitterType(id: number): string {
  if (!Number.isInteger(id) || !LITTER_TYPES.some((t) => t.id === id)) {
    throw new Error(`Litter type must be one of ${LITTER_TYPES.map((t) => `${t.id} (${t.name})`).join(', ')}`)
  }
  return encodeGateFrame(DeviceGate.LitterType, [id])
}

export function encodeAutoCleanDelay(minutes: number): string {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
    throw new Error('Auto-clean delay must be an integer between 1 and 60 minutes')
  }
  return encodeGateFrame(DeviceGate.SetAutoClearTime, [minutes])
}

export function parseHHMM(value: string): { h: number; m: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim())
  if (!m) throw new Error(`Invalid time "${value}", expected HH:MM`)
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) throw new Error(`Invalid time "${value}"`)
  return { h, m: min }
}

/**
 * Sleep / quiet window. Times are the device's local time.
 * The vendor app shipped a (disabled) "1–12 hours" validation hint, so we warn
 * but do not block longer windows.
 */
export function encodeSleepWindow(start: string, stop: string): string {
  const s = parseHHMM(start)
  const e = parseHHMM(stop)
  if (s.h === e.h && s.m === e.m) throw new Error('Sleep window start and stop must differ')
  return encodeGateFrame(DeviceGate.SetDisturbTime, [s.h, s.m, e.h, e.m])
}

export const encodeResetDeodorant = () => encodeGateFrame(DeviceGate.ResetDeodorant, [])

export function encodeWeightUnit(unit: 'kg' | 'lb'): string {
  if (unit !== 'kg' && unit !== 'lb') throw new Error('Weight unit must be "kg" or "lb"')
  return encodeGateFrame(DeviceGate.SetWeightUnit, [unit === 'lb' ? 1 : 0])
}

/**
 * UTC offset in whole hours. The vendor app sends `(-getTimezoneOffset()/60).toString(16)`
 * which is only well-formed for 0..+15; for negative offsets we send the two's-complement
 * byte, which is the most plausible firmware interpretation but is UNTESTED.
 */
export function encodeTimeZone(offsetHours: number): string {
  if (!Number.isInteger(offsetHours) || offsetHours < -12 || offsetHours > 14) {
    throw new Error('UTC offset must be a whole number of hours between -12 and +14')
  }
  const byte = offsetHours >= 0 ? offsetHours : 0x100 + offsetHours
  return encodeGateFrame(DeviceGate.SyncTimeZone, [byte])
}

/** Whole-hour UTC offset of an IANA time zone right now (DST-aware). */
export function utcOffsetHoursFor(timeZone: string, at: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]))
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return Math.round((asUtc - at.getTime()) / 3600000)
}

/* ------------------------------------------------------------------ */
/* High-level "setting" API used by the HTTP endpoints, MQTT and the UI */
/* ------------------------------------------------------------------ */

/**
 * Settings a user may change directly (dashboard, REST, MQTT).
 * `weight_unit` and `sync_timezone` are deliberately NOT here: they mirror the
 * dashboard account (user.weightUnit / user.timezone) and are pushed to the box
 * automatically by the daemon. `refresh` asks the box to re-report DP 103 (Tuya
 * DP_REFRESH first, time-zone push as fallback — see tuya-listener).
 */
export const SETTING_KEYS = [
  'auto_clean',
  'soft_clumps',
  'sleep_mode',
  'auto_off_screen',
  'child_lock',
  'auto_clean_delay',
  'sleep_window',
  'litter_type',
  'reset_deodorant',
  'refresh',
] as const

export type SettingKey = (typeof SETTING_KEYS)[number]

/** Keys only the daemon uses (account sync). */
export type InternalSettingKey = 'weight_unit' | 'sync_timezone'

export interface SettingCommand {
  key: SettingKey | InternalSettingKey
  /** base64 payload for DP 105 */
  payload: string
  /** human readable description for the event log */
  description: string
  /** false → do not write a `settings-changed` event (used for refresh pings) */
  logEvent?: boolean
}

const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['1', 'true', 'on', 'yes', 'enable', 'enabled'].includes(s)) return true
    if (['0', 'false', 'off', 'no', 'disable', 'disabled'].includes(s)) return false
  }
  throw new Error(`Expected a boolean, got ${JSON.stringify(v)}`)
}

/**
 * Validate a (setting, value) pair coming from the UI / REST / MQTT and turn it
 * into the DP 105 payload to send. Throws on invalid input.
 */
export function buildSettingCommand(key: string, value: unknown): SettingCommand {
  switch (key as SettingKey | InternalSettingKey) {
    case 'auto_clean': {
      const on = toBool(value)
      return { key: 'auto_clean', payload: encodeToggle(DeviceGate.AutoClear, on), description: `Auto-clean turned ${on ? 'on' : 'off'}` }
    }
    case 'soft_clumps': {
      const on = toBool(value)
      return { key: 'soft_clumps', payload: encodeToggle(DeviceGate.SoftClumps, on), description: `Soft clumps mode turned ${on ? 'on' : 'off'}` }
    }
    case 'sleep_mode': {
      const on = toBool(value)
      return { key: 'sleep_mode', payload: encodeToggle(DeviceGate.Sleep, on), description: `Sleep mode (quiet period) turned ${on ? 'on' : 'off'}` }
    }
    case 'auto_off_screen': {
      const on = toBool(value)
      return { key: 'auto_off_screen', payload: encodeToggle(DeviceGate.AutoOffScreen, on), description: `Auto screen-off turned ${on ? 'on' : 'off'}` }
    }
    case 'child_lock': {
      const on = toBool(value)
      return { key: 'child_lock', payload: encodeToggle(DeviceGate.ChildLock, on), description: `Screen child lock turned ${on ? 'on' : 'off'}` }
    }
    case 'auto_clean_delay': {
      const minutes = Number(value)
      return { key: 'auto_clean_delay', payload: encodeAutoCleanDelay(minutes), description: `Auto-clean delay set to ${minutes} min` }
    }
    case 'sleep_window': {
      const v = (value ?? {}) as { start?: string; stop?: string }
      if (!v.start || !v.stop) throw new Error('sleep_window requires { start: "HH:MM", stop: "HH:MM" }')
      return { key: 'sleep_window', payload: encodeSleepWindow(v.start, v.stop), description: `Sleep mode window set to ${v.start}–${v.stop}` }
    }
    case 'litter_type': {
      // Accept the numeric id or a (case-insensitive) name / keyword
      let id = Number(value)
      if (typeof value === 'string' && Number.isNaN(id)) {
        const q = value.trim().toLowerCase()
        const found = LITTER_TYPES.find((t) => t.name.toLowerCase() === q || t.name.toLowerCase().split(' ')[0] === q)
        if (found) id = found.id
      }
      const t = LITTER_TYPES.find((x) => x.id === id)
      return { key: 'litter_type', payload: encodeLitterType(id), description: `Litter type set to ${t?.name ?? id}` }
    }
    case 'reset_deodorant':
      return { key: 'reset_deodorant', payload: encodeResetDeodorant(), description: 'Deodorant pod counter reset on device' }
    case 'weight_unit': {
      const unit = String(value).toLowerCase() as 'kg' | 'lb'
      return { key: 'weight_unit', payload: encodeWeightUnit(unit), description: `Device weight unit set to ${unit}` }
    }
    case 'sync_timezone': {
      const offset = Number(value)
      const sign = offset >= 0 ? '+' : ''
      return { key: 'sync_timezone', payload: encodeTimeZone(offset), description: `Device time zone set to UTC${sign}${offset}` }
    }
    case 'refresh':
      // Handled by the daemon's `tuya:refresh-settings` hook (DP_REFRESH 0x12 first,
      // time-zone push as fallback) — never reaches the payload builder.
      throw new Error('refresh is dispatched through tuya:refresh-settings, not as a DP 105 payload')
    default:
      throw new Error(`Unknown setting "${key}". Allowed: ${SETTING_KEYS.join(', ')}`)
  }
}
