import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Olivia', email: 'hello@example.com', weightUnit: 'kg' } })
    }
    return { user }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    
    if (body.user) {
      const user = await prisma.user.findFirst()
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: body.user })
      } else {
        await prisma.user.create({ data: body.user })
      }
    }
    return { success: true }
  }
})
