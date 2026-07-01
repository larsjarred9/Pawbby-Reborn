import prisma from '../../utils/prisma'
import { verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  // 1. Fetch user by email
  const user = await prisma.user.findFirst({ where: { email } })

  if (!user || !user.passwordHash) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // 2. Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
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
