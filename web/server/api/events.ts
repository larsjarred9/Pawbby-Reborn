import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'POST') {
    const body = await readBody(event)
    const newEvent = await prisma.litterEvent.create({
      data: {
        deviceId: body.deviceId,
        type: body.type,
        rawData: body.rawData,
        petId: body.petId
      }
    })
    return { success: true, event: newEvent }
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    if (!body.id || body.petId === undefined) {
      return { success: false, error: 'Missing id or petId' }
    }
    const updatedEvent = await prisma.litterEvent.update({
      where: { id: body.id },
      data: { petId: body.petId }
    })
    return { success: true, event: updatedEvent }
  }

  const query = getQuery(event)
  const deviceId = query.deviceId as string

  if (!deviceId) return { events: [] }

  const dbEvents = await prisma.litterEvent.findMany({
    where: { 
      deviceId,
      type: { not: 'tuya-raw-data' }
    },
    orderBy: { timestamp: 'desc' }
  })

  const pets = await prisma.pet.findMany()
  const user = await prisma.user.findFirst()
  const isLbs = user?.weightUnit === 'lb'

  const formatWeight = (w: number) => {
    if (isLbs) {
      return (w * 2.20462).toFixed(1) + 'lbs'
    }
    return w.toFixed(1) + 'kg'
  }

  const mappedLogs = dbEvents.map(e => {
    let description = e.type
    
    if (e.type === 'toileted') {
      const pet = pets.find(p => p.id === e.petId)
      const name = pet ? pet.name : 'An unknown cat'
      description = `${name} used the litter box (Weight: ${formatWeight(e.weight || 0)}, Duration: ${e.duration}s)`
    } else if (e.type === 'quick-visit') {
      const pet = pets.find(p => p.id === e.petId)
      const name = pet ? pet.name : 'A cat'
      description = `${name} visited but didn't use it (Weight: ${formatWeight(e.weight || 0)}, Duration: ${e.duration}s)`
    } else if (e.type === 'reset-deodorizer' && e.rawData) {
      try {
        const parsed = JSON.parse(e.rawData)
        description = `Deodorizing pod reset for ${parsed.duration} days.`
      } catch (err) {}
    } else if (e.type === 'manual-clean') {
      description = 'Manual cleaning cycle was physically triggered on the device.'
    } else if (e.type === 'manual-clean-app') {
      description = 'Manual cleaning cycle started via Pawbby App.'
    } else if (e.type === 'auto-clean') {
      description = 'Automatic cleaning cycle completed.'
    } else if (e.type === 'flatten') {
      description = 'Litter flattening cycle was physically triggered on the device.'
    } else if (e.type === 'flatten-app') {
      description = 'Litter flattening cycle started via Pawbby App.'
    } else if (e.type === 'auto-flatten') {
      description = 'Litter box automatically flattened the litter after use.'
    } else if (e.type === 'empty') {
      description = 'Waste bin emptying cycle was physically triggered on the device.'
    } else if (e.type === 'empty-app') {
      description = 'Waste bin emptying cycle started via Pawbby App.'
    } else if (e.type === 'lid-removed') {
      description = 'Safety trigger: The lid was removed from the litter box.'
    } else if (e.type === 'lid-replaced') {
      description = 'The lid was put back on the litter box.'
    } else if (e.type === 'bin-removed') {
      description = 'Safety trigger: The waste collection bin was removed.'
    } else if (e.type === 'bin-replaced') {
      description = 'The waste collection bin was installed.'
    } else if (e.type === 'litter-added') {
      description = `${formatWeight(e.weight || 0)} of fresh litter was added to the box.`
    } else if (e.type === 'litter-removed') {
      description = `${formatWeight(e.weight || 0)} of litter was removed from the box.`
    } else if (e.type === 'tuya-raw-data' && e.rawData) {
      // Try to parse the raw data to extract something readable if possible
      try {
        const parsed = JSON.parse(e.rawData)
        if (parsed.dps) {
          description = `Raw DPS: ${JSON.stringify(parsed.dps)}`
        }
      } catch (err) {
        description = e.rawData
      }
    }

    const timeZone = user?.timezone || 'UTC'
    let timestampStr = ''
    let localDateStr = ''
    try {
      timestampStr = new Date(e.timestamp).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone })
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      localDateStr = formatter.format(new Date(e.timestamp))
    } catch (err) {
      // Fallback if invalid timezone string
      timestampStr = new Date(e.timestamp).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
      localDateStr = e.timestamp.toISOString().split('T')[0]
    }

    return {
      id: e.id,
      deviceId: e.deviceId,
      petId: e.petId,
      type: e.type,
      rawTimestamp: e.timestamp.toISOString(),
      localDate: localDateStr,
      // Format to MM/DD HH:mm
      timestamp: timestampStr,
      description
    }
  })

  return { events: mappedLogs }
})
