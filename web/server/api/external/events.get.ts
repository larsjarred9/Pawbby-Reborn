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

  const query = getQuery(event)
  const deviceId = query.deviceId as string
  const limit = parseInt(query.limit as string) || 50
  const from = query.from as string
  const to = query.to as string

  if (!deviceId) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request: Missing deviceId query parameter' })
  }

  const whereClause: any = { deviceId }
  if (from || to) {
    whereClause.timestamp = {}
    if (from) {
      whereClause.timestamp.gte = new Date(from)
    }
    if (to) {
      whereClause.timestamp.lte = new Date(to)
    }
  }

  const events = await prisma.litterEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: limit
  })

  return { events }
})
