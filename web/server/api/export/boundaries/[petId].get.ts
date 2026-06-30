import prisma from '../../../utils/prisma'
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

  // Format as local YYYY-MM-DD
  const getLocalYMD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const oldestDate = getLocalYMD(oldestEvent.timestamp)
  const newestDate = getLocalYMD(newestEvent.timestamp)

  return {
    hasData: true,
    oldest: oldestDate,
    newest: newestDate
  }
})
