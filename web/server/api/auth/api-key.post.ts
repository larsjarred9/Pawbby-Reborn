import crypto from 'crypto'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Find the primary user
  const user = await prisma.user.findFirst()
  
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'No user exists. Please complete setup first.' })
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
