import prisma from './prisma'

export interface DeviceLiveState {
  status: string // "Ready" | "Busy" | "Lid Open" | "Bin Removed" | "Bin Full"
  wasteBin: string // "Normal" | "Full"
  litterLevel: string // "Sufficient*" | "Insufficient*"
  lidOpen: boolean
  binRemoved: boolean
  todayToileted: number
  lastHeartbeat: Date | null
  latestWeight: number | null // kg, from the most recent completed visit
  lastVisitPet: string | null // pet name, or null if unidentified/none
  lastVisitAt: Date | null
  deodorizerActive: boolean
  deodorizerDaysLeft: number | null
}

/**
 * Derive the current human-readable state of a litter box from the raw Tuya payloads
 * we have logged. This is the single source of truth shared by the dashboard
 * (`/api/devices`) and the external API (`/api/external/state`, e.g. Home Assistant).
 */
export async function computeDeviceState(device: {
  id: string
  deodorizerLastReset?: Date | null
  deodorizerDuration?: number
}): Promise<DeviceLiveState> {
  const deviceId = device.id

  const latestRaw = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data' },
    orderBy: { timestamp: 'desc' },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayToileted = await prisma.litterEvent.count({
    where: { deviceId, type: 'toileted', timestamp: { gte: today } },
  })

  let wasteBin = 'Normal'
  let litterLevel = 'Sufficient*'
  let status = 'Ready'
  let lidOpen = false

  // Find the most recent raw data that contains DP 102 (clean cycle count/fault code)
  const latestDP102Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"102"' } },
    orderBy: { timestamp: 'desc' },
  })
  if (latestDP102Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP102Event.rawData)
      const base64Str = parsed?.dps?.['102']
      if (typeof base64Str === 'string') {
        const buffer = Buffer.from(base64Str, 'base64')
        // If bytes 1 or 2 indicate a fault code, assume it's the insufficient litter error
        if (buffer.length > 2 && (buffer[1] > 0 || buffer[2] > 0)) {
          litterLevel = 'Insufficient*'
        }
      }
    } catch (e) {}
  }

  // Check DP 114 for motor/sensor errors
  const latestDP114Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"114"' } },
    orderBy: { timestamp: 'desc' },
  })
  if (latestDP114Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP114Event.rawData)
      if (parsed?.dps?.['114']) {
        const dp114 = String(parsed.dps['114']).toLowerCase()
        if (dp114 !== 'motor_ok') litterLevel = 'Insufficient*'
      }
    } catch (e) {}
  }

  // Check DP 112 for low weight
  const latestDP112Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"112"' } },
    orderBy: { timestamp: 'desc' },
  })
  if (latestDP112Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP112Event.rawData)
      if (parsed?.dps?.['112'] !== undefined) {
        const weight = Number(parsed.dps['112'])
        if (weight > 0 && weight < 1500) litterLevel = 'Insufficient*'
      }
    } catch (e) {}
  }

  let binRemoved = false

  // Check for persistent Bin Full state
  const latestCollectFull = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"collect_full"' } },
    orderBy: { timestamp: 'desc' },
  })
  const latestBinReplaced = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'bin-replaced' },
    orderBy: { timestamp: 'desc' },
  })

  let isBinFullState = false
  if (latestCollectFull) {
    const fullTime = latestCollectFull.timestamp.getTime()
    const replacedTime = latestBinReplaced ? latestBinReplaced.timestamp.getTime() : 0
    if (fullTime > replacedTime) isBinFullState = true
  }

  // Check DP 116 for status
  const latestDP116Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"116"' } },
    orderBy: { timestamp: 'desc' },
  })
  if (latestDP116Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP116Event.rawData)
      if (parsed?.dps?.['116']) {
        const dp116 = String(parsed.dps['116'])
        if (dp116 === 'lid_open') {
          status = 'Lid Open'
          lidOpen = true
        } else if (dp116 === 'collect_install') {
          status = 'Bin Removed'
          binRemoved = true
        } else if (dp116 === 'collect_full') {
          status = 'Bin Full'
          wasteBin = 'Full'
        } else if (dp116 !== 'work_idle') {
          status = 'Busy'
        }
      }
    } catch (e) {}
  }

  // Override status if the bin is persistently full (and not currently removed or open)
  if (isBinFullState) {
    wasteBin = 'Full'
    if (!lidOpen && !binRemoved && status === 'Ready') status = 'Bin Full'
  }

  // Most recent completed visit (weight + which pet)
  const lastVisit = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'toileted' },
    orderBy: { timestamp: 'desc' },
  })
  let lastVisitPet: string | null = null
  if (lastVisit?.petId) {
    const pet = await prisma.pet.findUnique({ where: { id: lastVisit.petId } })
    lastVisitPet = pet?.name ?? null
  }

  // Deodorizer life remaining
  let deodorizerActive = false
  let deodorizerDaysLeft: number | null = null
  if (device.deodorizerLastReset) {
    const duration = device.deodorizerDuration ?? 30
    const elapsedDays = (Date.now() - new Date(device.deodorizerLastReset).getTime()) / 86400000
    deodorizerDaysLeft = Math.max(0, Math.round(duration - elapsedDays))
    deodorizerActive = deodorizerDaysLeft > 0
  }

  return {
    status,
    wasteBin,
    litterLevel,
    lidOpen,
    binRemoved,
    todayToileted,
    lastHeartbeat: latestRaw ? latestRaw.timestamp : null,
    latestWeight: lastVisit?.weight ?? null,
    lastVisitPet,
    lastVisitAt: lastVisit?.timestamp ?? null,
    deodorizerActive,
    deodorizerDaysLeft,
  }
}
