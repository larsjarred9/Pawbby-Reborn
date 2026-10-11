import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Check if session exists
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
  }
  const session = await useSession(event, sessionConfig)

  // Verify that the session user actually exists in the DB
  let sessionUser = null
  if (session.data.userId) {
    sessionUser = await prisma.user.findUnique({ where: { id: session.data.userId } })
    if (!sessionUser) {
      await session.clear()
    }
  }

  // Check if any user exists in the DB
  const firstUser = await prisma.user.findFirst()

  const isAuthenticated = !!sessionUser
  const isAdmin = sessionUser?.role === 'ADMIN'

  return {
    isAuthenticated,
    isAdmin,
    hasUser: !!firstUser,
    hasPassword: !!firstUser?.passwordHash,
    legacyName: firstUser && !firstUser.passwordHash ? firstUser.name : null,
    legacyEmail: firstUser && !firstUser.passwordHash ? firstUser.email : null
  }
})
