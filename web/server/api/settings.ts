import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({ data: { name: 'User', email: 'hello@example.com', weightUnit: 'kg' } })
    }
    return { user }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    
    if (body.user) {
      // Destructure to prevent mass assignment vulnerabilities
      const { 
        name, email, weightUnit, webhookUrl, timezone,
        notifyPushVisit, notifyPushAutoClean, notifyPushManualClean, notifyPushEmpty, notifyPushFlatten, notifyPushError,
        notifyDashVisit, notifyDashAutoClean, notifyDashManualClean, notifyDashEmpty, notifyDashFlatten, notifyDashError
      } = body.user
      
      const safeData = { 
        name, email, weightUnit, webhookUrl, timezone,
        notifyPushVisit, notifyPushAutoClean, notifyPushManualClean, notifyPushEmpty, notifyPushFlatten, notifyPushError,
        notifyDashVisit, notifyDashAutoClean, notifyDashManualClean, notifyDashEmpty, notifyDashFlatten, notifyDashError
      }
      
      const user = await prisma.user.findFirst()
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: safeData })
      } else {
        await prisma.user.create({ data: safeData })
      }
    }
    return { success: true }
  }
})
