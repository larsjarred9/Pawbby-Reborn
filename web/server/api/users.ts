import prisma from '../utils/prisma'
import { hashPassword } from '../utils/auth'
export default defineEventHandler(async (event) => {
  // Only ADMINs can access this endpoint
  if (event.context.userRole !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admins only'
    })
  }

  const method = event.node.req.method

  if (method === 'GET') {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        id: 'asc'
      }
    })
    return users
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, email, password } = body

    if (!name || !email || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Name, email, and password are required' })
    }

    const subUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'USER'
      }
    })
    
    return { success: true, user: { id: subUser.id, name: subUser.name, email: subUser.email, role: subUser.role } }
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    const targetUserId = query.id as string

    if (!targetUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    if (targetUserId === event.context.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You cannot delete your own account'
      })
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    })

    return { success: true }
  }
})
