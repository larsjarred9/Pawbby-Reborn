import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Check if session exists
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
  }
  const session = await useSession(event, sessionConfig)
  const isAuthenticated = !!session.data.userId

  // Check if any user exists in the DB
  const firstUser = await prisma.user.findFirst()
  
  let isAdmin = false
  if (isAuthenticated) {
    if (session.data.role) {
      isAdmin = session.data.role === 'ADMIN'
    } else {
      // Legacy session without role, check DB
      const dbUser = await prisma.user.findUnique({ where: { id: session.data.userId } })
      isAdmin = dbUser?.role === 'ADMIN'
    }
  }

  return {
    isAuthenticated,
    isAdmin,
    hasUser: !!firstUser,
    hasPassword: !!firstUser?.passwordHash,
    legacyName: firstUser && !firstUser.passwordHash ? firstUser.name : null,
    legacyEmail: firstUser && !firstUser.passwordHash ? firstUser.email : null
  }
})
