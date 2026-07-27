import prisma from '../../utils/prisma'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Name, email, and password are required' })
  }

  // 1. Check if user exists
  let user = await prisma.user.findFirst()

  if (user) {
    if (user.passwordHash) {
      // If user exists and has a password, we only allow creating a new account if logged in as an ADMIN
      const sessionConfig = {
        password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
      }
      const session = await useSession(event, sessionConfig)
      let isAdmin = false
      if (session.data.userId) {
        if (session.data.role) {
          isAdmin = session.data.role === 'ADMIN'
        } else {
          // Legacy session without role, check DB
          const dbUser = await prisma.user.findUnique({ where: { id: session.data.userId } })
          isAdmin = dbUser?.role === 'ADMIN'
        }
      }

      if (!isAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Only administrators can create new accounts.' })
      }

      // Create new sub-user
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

    // User exists but NO password (0.3.0 migration)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'ADMIN' // Ensure migrated user is admin
      }
    })
  } else {
    // 2. Create the very first user (ADMIN)
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'ADMIN'
      }
    })
  }

  // 3. Establish 10-year session cookie
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
    cookie: {
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      secure: false
    }
  }
  
  const session = await useSession(event, sessionConfig)
  await session.update({ userId: user.id, role: user.role })

  return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
})
