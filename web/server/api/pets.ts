import prisma from '../utils/prisma'

// Refresh MQTT/HA entities (cats map to Home Assistant devices) after a change.
const refreshMqtt = () => useNitroApp().hooks.callHook('mqtt:refresh' as any)

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    return await prisma.pet.findMany()
  }

  if (method === 'POST') {
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
    const query = getQuery(event)
    if (query.id) {
      await prisma.pet.delete({ where: { id: String(query.id) } })
      await refreshMqtt()
    }
    return { success: true }
  }
})
