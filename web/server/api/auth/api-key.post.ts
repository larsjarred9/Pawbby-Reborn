import crypto from 'crypto'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Find the primary user
  let user = await prisma.user.findFirst()
  
  if (!user) {
    user = await prisma.user.create({ data: { name: 'User', email: 'hello@example.com', weightUnit: 'kg' } })
  }

  // Generate a new secure API key
  const newApiKey = crypto.randomBytes(32).toString('hex')

  // Save the key
  await prisma.user.update({
    where: { id: user.id },
    data: { apiKey: newApiKey }
  })

  return { apiKey: newApiKey }
})
