import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const deviceId = query.deviceId as string
  const days = Number(query.days) || 7

  if (!deviceId) throw new Error('Device ID required')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // 1. Fetch toileted events
  const events = await prisma.litterEvent.findMany({
    where: {
      deviceId,
      type: 'toileted',
      timestamp: { gte: startDate }
    },
    orderBy: { timestamp: 'asc' }
  })

  // 2. Fetch pets for metadata
  const pets = await prisma.pet.findMany()
  const petMap = new Map(pets.map(p => [p.id, p]))

  // 3. Generate date labels
  const labels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  // 4. Group data by day and pet
  // We'll organize it as:
  // aggregated[petId][dateString] = { count, totalWeight, totalDuration }
  
  const aggregated: Record<string, Record<string, { count: number, weight: number, duration: number }>> = {}
  
  // Initialize for all pets
  pets.forEach(p => {
    aggregated[p.id] = {}
    labels.forEach(l => {
      aggregated[p.id][l] = { count: 0, weight: 0, duration: 0 }
    })
  })
  
  // Also track unknown pets
  aggregated['unknown'] = {}
  labels.forEach(l => {
    aggregated['unknown'][l] = { count: 0, weight: 0, duration: 0 }
  })

  const user = await prisma.user.findFirst()
  const isLbs = user?.weightUnit === 'lb'

  events.forEach(e => {
    const dateStr = e.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const pid = e.petId || 'unknown'
    
    // Ignore if dateStr is outside our labels (e.g. timezone edge cases)
    if (aggregated[pid] && aggregated[pid][dateStr]) {
      aggregated[pid][dateStr].count += 1
      
      // Convert weight to lbs if preferred
      let w = e.weight || 0
      if (isLbs) {
        w = w * 2.20462
      }
      
      aggregated[pid][dateStr].weight += w
      aggregated[pid][dateStr].duration += (e.duration || 0)
    }
  })

  // 5. Format datasets for Chart.js
  const colors = ['#F9A826', '#3D7A41', '#2A6372', '#D84C4C', '#9CA3AF']

  // Visit Count Dataset
  const visitDatasets = Object.keys(aggregated).map((pid, idx) => {
    const petName = pid === 'unknown' ? 'Unknown' : petMap.get(pid)?.name || 'Unknown'
    const data = labels.map(l => aggregated[pid][l].count)
    return {
      label: petName,
      data,
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length],
      borderWidth: 2,
      borderRadius: 4
    }
  }).filter(ds => ds.data.some(v => v > 0)) // Only include pets that have data

  // Average Weight Dataset
  const weightDatasets = Object.keys(aggregated).map((pid, idx) => {
    const petName = pid === 'unknown' ? 'Unknown' : petMap.get(pid)?.name || 'Unknown'
    const data = labels.map(l => {
      const agg = aggregated[pid][l]
      return agg.count > 0 ? Number((agg.weight / agg.count).toFixed(2)) : null
    })
    return {
      label: petName,
      data,
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length],
      borderWidth: 3,
      tension: 0.4,
      spanGaps: true
    }
  }).filter(ds => ds.data.some(v => v !== null))

  // Average Duration Dataset
  const durationDatasets = Object.keys(aggregated).map((pid, idx) => {
    const petName = pid === 'unknown' ? 'Unknown' : petMap.get(pid)?.name || 'Unknown'
    const data = labels.map(l => {
      const agg = aggregated[pid][l]
      return agg.count > 0 ? Math.round(agg.duration / agg.count) : null
    })
    return {
      label: petName,
      data,
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length],
      borderWidth: 3,
      tension: 0.4,
      spanGaps: true
    }
  }).filter(ds => ds.data.some(v => v !== null))

  // Waste Output Dataset (Approximation based on visits * average waste per visit)
  // Since we don't have accurate delta weights, we estimate ~25g (0.025kg) of waste per minute of duration
  const wasteDatasets = Object.keys(aggregated).map((pid, idx) => {
    const petName = pid === 'unknown' ? 'Unknown' : petMap.get(pid)?.name || 'Unknown'
    const data = labels.map(l => {
      const agg = aggregated[pid][l]
      // estimate 25g (0.025kg) per minute, minimum 10g
      const durationMins = agg.duration / 60
      return agg.count > 0 ? Number(((durationMins * 25) + (agg.count * 10)).toFixed(0)) : 0
    })
    return {
      label: petName,
      data,
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length],
      borderWidth: 2,
      borderRadius: 4
    }
  }).filter(ds => ds.data.some(v => v > 0))

  return {
    labels,
    charts: {
      visits: visitDatasets,
      weight: weightDatasets,
      duration: durationDatasets,
      waste: wasteDatasets
    }
  }
})
