import prisma from '../utils/prisma'

export default defineNitroPlugin(async (nitroApp) => {
  try {
    // 1. Check if there are any users in the database
    const userCount = await prisma.user.count()
    if (userCount === 0) return // Fresh install, no migration needed

    // 2. Check if there are ANY admins
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    // 3. If there are users, but NO admins, this is an upgrade from 0.6.2
    if (adminCount === 0) {
      console.log('🔄 Running runtime migration: Elevating all existing pre-RBAC users to ADMIN to preserve their access...')
      await prisma.user.updateMany({
        data: { role: 'ADMIN' }
      })
      console.log('✅ Migration complete!')
    }
  } catch (err) {
    console.error('Failed to run database migrations on startup:', err)
  }
})
