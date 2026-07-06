import prisma from '../../utils/prisma'

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
  const { deviceId, action } = body

  if (!deviceId || !action) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing deviceId or action in request body' })
  }

  const allowedActions = ['clean', 'flatten', 'empty']
  if (!allowedActions.includes(action)) {
    throw createError({ statusCode: 400, statusMessage: `Bad Request: Invalid action. Allowed actions: ${allowedActions.join(', ')}` })
  }

  const nitro = useNitroApp()
  // Trigger background action
  await nitro.hooks.callHook('tuya:action' as any, { deviceId, action })

  return { success: true, message: `Action '${action}' dispatched to device '${deviceId}'` }
})
