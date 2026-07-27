import prisma from '../utils/prisma'

// Refresh MQTT/HA entities (cats map to Home Assistant devices) after a change.
const refreshMqtt = () => useNitroApp().hooks.callHook('mqtt:refresh' as any)

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    return await prisma.pet.findMany()
  }

  if (method === 'POST') {
    if (event.context.userRole !== 'ADMIN') {
      throw createError({ statusCode: 403, statusMessage: 'Only administrators can modify pets.' })
    }

    const body = await readBody(event)
    const { name, birthDate, weight, imageBase64 } = body
    const safeData = { name, birthDate, weight, imageBase64 }

    const result = body.id
      ? await prisma.pet.update({ where: { id: body.id }, data: safeData })
      : await prisma.pet.create({ data: safeData })
    await refreshMqtt()
    return result
  }

  if (method === 'DELETE') {
    if (event.context.userRole !== 'ADMIN') {
      throw createError({ statusCode: 403, statusMessage: 'Only administrators can delete pets.' })
    }

    const query = getQuery(event)
    if (query.id) {
      await prisma.pet.delete({ where: { id: String(query.id) } })
      await refreshMqtt()
    }
    return { success: true }
  }
})
