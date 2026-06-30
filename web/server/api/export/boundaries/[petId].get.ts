import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const petId = getRouterParam(event, 'petId')

  if (!petId) {
    throw createError({ statusCode: 400, statusMessage: 'Pet ID is required' })
  }

  // Fetch the earliest and latest visit events for this pet
  const oldestEvent = await prisma.litterEvent.findFirst({
    where: { petId, type: 'toileted' },
    orderBy: { timestamp: 'asc' }
  })

  const newestEvent = await prisma.litterEvent.findFirst({
    where: { petId, type: 'toileted' },
    orderBy: { timestamp: 'desc' }
  })

  if (!oldestEvent || !newestEvent) {
    return {
      hasData: false,
      oldest: null,
      newest: null
    }
  }

  // Format as YYYY-MM-DD
  const oldestDate = oldestEvent.timestamp.toISOString().split('T')[0]
  const newestDate = newestEvent.timestamp.toISOString().split('T')[0]

  return {
    hasData: true,
    oldest: oldestDate,
    newest: newestDate
  }
})
