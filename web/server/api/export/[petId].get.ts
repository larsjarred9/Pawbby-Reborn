import prisma from '../../utils/prisma'
export default defineEventHandler(async (event) => {
  const petId = getRouterParam(event, 'petId')

  if (!petId) {
    throw createError({ statusCode: 400, statusMessage: 'Pet ID is required' })
  }

  // Fetch the pet to use its name in the file
  const pet = await prisma.pet.findUnique({
    where: { id: petId }
  })

  if (!pet) {
    throw createError({ statusCode: 404, statusMessage: 'Pet not found' })
  }

  const query = getQuery(event)
  const startRaw = query.start as string | undefined
  const endRaw = query.end as string | undefined
  
  const startDate = startRaw ? new Date(startRaw) : undefined
  const endDate = endRaw ? new Date(endRaw) : undefined

  if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid start/end date format' })
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999)
  }

  const whereClause: any = {
    petId: petId,
    type: 'toileted'
  }

  if (startDate || endDate) {
    whereClause.timestamp = {}
    if (startDate) whereClause.timestamp.gte = startDate
    if (endDate) whereClause.timestamp.lte = endDate
  }

  // Fetch visit events for this pet within the date range
  const events = await prisma.litterEvent.findMany({
    where: whereClause,
    orderBy: {
      timestamp: 'desc'
    }
  })

  // Build the CSV string
  const headers = ['Date', 'Time', 'Duration (seconds)', 'Weight (kg)']
  const rows = events.map(e => {
    const d = new Date(e.timestamp)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${day}`
    const timeStr = d.toTimeString().split(' ')[0] // HH:MM:SS
    const duration = e.duration || 0
    const weight = e.weight?.toFixed(2) || '0.00'
    return `${dateStr},${timeStr},${duration},${weight}`
  })

  const csvContent = [headers.join(','), ...rows].join('\n')

  // Sanitize pet name for filename
  const safePetName = pet.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const dNow = new Date()
  const yNow = dNow.getFullYear()
  const mNow = String(dNow.getMonth() + 1).padStart(2, '0')
  const dayNow = String(dNow.getDate()).padStart(2, '0')
  const dateStr = `${yNow}-${mNow}-${dayNow}`
  const filename = `${safePetName}_vet_export_${dateStr}.csv`

  // Set headers to trigger a file download in the browser
  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csvContent
})
