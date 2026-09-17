import prisma from './prisma'

export interface DeviceLiveState {
  status: string // "Ready" | "Busy" | "Lid Open" | "Bin Removed" | "Bin Full" | "Drum Removed" | "Motor Error"
  wasteBin: string // "Normal" | "Full"
  litterLevel: string // "Sufficient" | "Low"
  lidOpen: boolean
  binRemoved: boolean
  drumRemoved: boolean
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
  let litterLevel = 'Sufficient'
  let status = 'Ready'
  let lidOpen = false

  // Check DP 116 or recent litter events for native litter level
  const latestLitterLowEvent = await prisma.litterEvent.findFirst({
    where: {
      deviceId,
      OR: [
        { type: 'litter-low' },
        { type: 'tuya-raw-data', rawData: { contains: '"cat_litter_little"' } },
      ],
    },
    orderBy: { timestamp: 'desc' },
  })
  const latestLitterSufficientEvent = await prisma.litterEvent.findFirst({
    where: {
      deviceId,
      OR: [
        { type: 'litter-sufficient' },
        { type: 'tuya-raw-data', rawData: { contains: '"cat_litter_eno' } },
      ],
    },
    orderBy: { timestamp: 'desc' },
  })

  if (latestLitterLowEvent) {
    const lowTime = latestLitterLowEvent.timestamp.getTime()
    const suffTime = latestLitterSufficientEvent ? latestLitterSufficientEvent.timestamp.getTime() : 0
    if (lowTime > suffTime) {
      litterLevel = 'Low'
    } else {
      litterLevel = 'Sufficient'
    }
  } else if (latestLitterSufficientEvent) {
    litterLevel = 'Sufficient'
  } else {
    // Fallback heuristic: check DP 112 for low weight if no native DP 116 events yet
    const latestDP112Event = await prisma.litterEvent.findFirst({
      where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"112"' } },
      orderBy: { timestamp: 'desc' },
    })
    if (latestDP112Event?.rawData) {
      try {
        const parsed = JSON.parse(latestDP112Event.rawData)
        if (parsed?.dps?.['112'] !== undefined) {
          const weight = Number(parsed.dps['112'])
          if (weight > 0 && weight < 1500) litterLevel = 'Low'
        }
      } catch (e) {}
    }
  }

  // Check DP 114 for motor/sensor errors
  const latestDP114Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"114"' } },
    orderBy: { timestamp: 'desc' },
  })
  let isMotorError = false
  if (latestDP114Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP114Event.rawData)
      if (parsed?.dps?.['114']) {
        const dp114 = String(parsed.dps['114']).toLowerCase()
        if (dp114 !== 'motor_ok') isMotorError = true
      }
    } catch (e) {}
  }

  let binRemoved = false

  // Check for persistent Bin Full state
  const latestCollectFull = await prisma.litterEvent.findFirst({
    where: {
      deviceId,
      OR: [
        { type: 'bin-full' },
        { type: 'tuya-raw-data', rawData: { contains: '"collect_full"' } },
      ],
    },
    orderBy: { timestamp: 'desc' },
  })
  const latestBinReplaced = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'bin-replaced' },
    orderBy: { timestamp: 'desc' },
  })
  const latestCollectNormal = await prisma.litterEvent.findFirst({
    where: {
      deviceId,
      OR: [
        { type: 'bin-normal' },
        { type: 'tuya-raw-data', rawData: { contains: '"collect_normal"' } },
      ],
    },
    orderBy: { timestamp: 'desc' },
  })

  let isBinFullState = false
  if (latestCollectFull) {
    const fullTime = latestCollectFull.timestamp.getTime()
    const replacedTime = latestBinReplaced ? latestBinReplaced.timestamp.getTime() : 0
    const normalTime = latestCollectNormal ? latestCollectNormal.timestamp.getTime() : 0
    if (fullTime > replacedTime && fullTime > normalTime) isBinFullState = true
  }

  // Check for persistent Drum Removed state
  const latestDrumRemoved = await prisma.litterEvent.findFirst({
    where: {
      deviceId,
      OR: [
        { type: 'drum-removed' },
        { type: 'tuya-raw-data', rawData: { contains: '"roller_uninstall_ok"' } },
      ],
    },
    orderBy: { timestamp: 'desc' },
  })
  const latestDrumInstalled = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'drum-installed' },
    orderBy: { timestamp: 'desc' },
  })
  let isDrumRemovedState = false
  if (latestDrumRemoved) {
    const removedTime = latestDrumRemoved.timestamp.getTime()
    const installedTime = latestDrumInstalled ? latestDrumInstalled.timestamp.getTime() : 0
    if (removedTime > installedTime) isDrumRemovedState = true
  }
  let drumRemoved = isDrumRemovedState

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
        } else if (dp116 === 'roller_uninstall_ok') {
          status = 'Drum Removed'
          drumRemoved = true
        } else if (dp116 === 'collect_full') {
          status = 'Bin Full'
          wasteBin = 'Full'
        } else if (dp116 === 'cat_litter_little') {
          litterLevel = 'Low'
        } else if (dp116 === 'cat_litter_enough' || dp116.startsWith('cat_litter_eno')) {
          litterLevel = 'Sufficient'
        } else if (dp116 !== 'work_idle' && dp116 !== 'collect_normal' && dp116 !== 'lid_close') {
          status = 'Busy'
        }
      }
    } catch (e) {}
  }

  // Override status if drum is removed
  if (drumRemoved && status === 'Ready') {
    status = 'Drum Removed'
  }

  // Override status if the bin is persistently full (and not currently removed or open)
  if (isBinFullState) {
    wasteBin = 'Full'
    if (!lidOpen && !binRemoved && status === 'Ready') status = 'Bin Full'
  }

  // Override status if motor error was detected and device is otherwise idle
  if (isMotorError && status === 'Ready') {
    status = 'Motor Error'
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

  // Check DP 115 for hardware deodorizer days remaining reported by device
  const latestDP115Event = await prisma.litterEvent.findFirst({
    where: { deviceId, type: 'tuya-raw-data', rawData: { contains: '"115"' } },
    orderBy: { timestamp: 'desc' },
  })
  if (latestDP115Event?.rawData) {
    try {
      const parsed = JSON.parse(latestDP115Event.rawData)
      if (parsed?.dps?.['115'] !== undefined) {
        const d115 = Number(parsed.dps['115'])
        if (!isNaN(d115) && d115 >= 0) {
          deodorizerDaysLeft = d115
          deodorizerActive = d115 > 0
        }
      }
    } catch (e) {}
  }

  return {
    status,
    wasteBin,
    litterLevel,
    lidOpen,
    binRemoved,
    drumRemoved,
    todayToileted,
    lastHeartbeat: latestRaw ? latestRaw.timestamp : null,
    latestWeight: lastVisit?.weight ?? null,
    lastVisitPet,
    lastVisitAt: lastVisit?.timestamp ?? null,
    deodorizerActive,
    deodorizerDaysLeft,
  }
}
