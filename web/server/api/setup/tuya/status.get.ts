import { pollTuyaQrLogin, fetchTuyaDevices } from '../../../utils/tuyaSharing'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string
  const userCode = query.userCode as string

  if (!token || !userCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token and User Code are required.'
    })
  }

  const pollResult = await pollTuyaQrLogin(token, userCode)

  if (!pollResult.success) {
    return {
      success: false,
      confirmed: false,
      error: pollResult.error || 'Authentication failed or expired'
    }
  }

  if (!pollResult.confirmed || !pollResult.session) {
    return {
      success: true,
      confirmed: false
    }
  }

  // Once login is confirmed, immediately fetch the user's devices
  try {
    const devices = await fetchTuyaDevices(pollResult.session)
    return {
      success: true,
      confirmed: true,
      devices
    }
  } catch (err: any) {
    console.error('Failed to fetch Tuya devices after QR login:', err)
    return {
      success: true,
      confirmed: true,
      devices: [],
      error: err?.message || 'Logged in, but failed to retrieve devices'
    }
  }
})

