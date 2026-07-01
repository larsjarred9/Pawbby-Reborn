import prisma from '../../utils/prisma'
import { verifyPassword, hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Current and new password are required' })
  }

  if (newPassword.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'New password must be at least 6 characters' })
  }

  // Get current user from session
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
  }
  const session = await useSession(event, sessionConfig)
  const userId = session.data.userId

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user || !user.passwordHash) {
    throw createError({ statusCode: 401, statusMessage: 'User not found or no password set' })
  }

  // Verify current password
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw createError({ statusCode: 403, statusMessage: 'Current password is incorrect' })
  }

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) }
  })

  return { success: true }
})
