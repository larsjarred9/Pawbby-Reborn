export default defineEventHandler(async (event) => {
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
    cookie: {
      maxAge: 0, // Expire immediately
      secure: false
    }
  }
  
  const session = await useSession(event, sessionConfig)
  await session.clear()

  return { success: true }
})
