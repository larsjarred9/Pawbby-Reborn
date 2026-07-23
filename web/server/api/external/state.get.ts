import prisma from '../../utils/prisma'
import { computeDeviceState } from '../../utils/deviceState'
import { computePetStates } from '../../utils/petState'

// Consider a device "online" if it has reported to us within the last 15 minutes
// (the listener sends a keepalive ping every 5 minutes).
const ONLINE_WINDOW_MS = 15 * 60 * 1000

function shape(device: any, state: Awaited<ReturnType<typeof computeDeviceState>>) {
  const online = !!state.lastHeartbeat && Date.now() - new Date(state.lastHeartbeat).getTime() < ONLINE_WINDOW_MS
  return {
    id: device.id,
    name: device.name,
    deviceId: device.deviceId,
    mode: device.mode,
    online,
    status: state.status,
    wasteBin: state.wasteBin,
    litterLevel: state.litterLevel,
    lidOpen: state.lidOpen,
    binRemoved: state.binRemoved,
    todayToileted: state.todayToileted,
    latestWeight: state.latestWeight,
    lastVisitPet: state.lastVisitPet,
    lastVisitAt: state.lastVisitAt,
    deodorizerActive: state.deodorizerActive,
    deodorizerDaysLeft: state.deodorizerDaysLeft,
    lastHeartbeat: state.lastHeartbeat,
  }
}

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

  const query = getQuery(event)
  const deviceId = query.deviceId as string | undefined

  // Cats are global to the install (not device-scoped), so they are included alongside.
  const pets = await computePetStates()

  // Single device (Home Assistant REST sensors point at one resource)
  if (deviceId) {
    const device = await prisma.device.findUnique({ where: { id: deviceId } })
    if (!device) {
      throw createError({ statusCode: 404, statusMessage: `Device '${deviceId}' not found` })
    }
    return { ...shape(device, await computeDeviceState(device)), pets }
  }

  // All devices
  const devices = await prisma.device.findMany()
  const result = await Promise.all(
    devices.map(async (d) => shape(d, await computeDeviceState(d))),
  )
  return { devices: result, pets }
})
