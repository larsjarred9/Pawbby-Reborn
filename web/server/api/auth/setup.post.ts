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
    // If user exists AND has a password, setup is already complete!
    if (user.passwordHash) {
      throw createError({ statusCode: 403, statusMessage: 'Setup already completed. Please login.' })
    }

    // User exists but NO password (0.3.0 migration)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        passwordHash: hashPassword(password)
      }
    })
  } else {
    // 2. Create new user
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password)
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
  await session.update({ userId: user.id })

  return { success: true, user: { id: user.id, name: user.name, email: user.email } }
})
