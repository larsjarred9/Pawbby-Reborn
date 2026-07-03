import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Check if session exists
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
  }
  const session = await useSession(event, sessionConfig)
  const isAuthenticated = !!session.data.userId

  // Check if any user exists in the DB
  const user = await prisma.user.findFirst()
  
  return {
    isAuthenticated,
    hasUser: !!user,
    hasPassword: !!user?.passwordHash,
    legacyName: user && !user.passwordHash ? user.name : null,
    legacyEmail: user && !user.passwordHash ? user.email : null
  }
})
