import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    return await prisma.pet.findMany()
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, birthDate, weight, imageBase64 } = body
    const safeData = { name, birthDate, weight, imageBase64 }

    if (body.id) {
       return await prisma.pet.update({ where: { id: body.id }, data: safeData })
    }
    return await prisma.pet.create({ data: safeData })
  }
  
  if (method === 'DELETE') {
    const query = getQuery(event)
    if (query.id) {
      await prisma.pet.delete({ where: { id: String(query.id) } })
    }
    return { success: true }
  }
})
