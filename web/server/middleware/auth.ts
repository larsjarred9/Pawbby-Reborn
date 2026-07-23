export default defineEventHandler(async (event) => {
  // 1. Always allow auth endpoints (login, setup, logout)
  if (event.path.startsWith('/api/auth/')) {
    return
  }

  // 2. We only want to protect /api/* endpoints
  if (!event.path.startsWith('/api/')) {
    return
  }
  
  // 3. We allow the Tuya update webhook from the device to pass through if it exists.
  // We already have webhook validation in those routes.
  if (event.path.startsWith('/api/webhook/')) {
    return
  }

  // 4. The external API (Home Assistant & other integrations) authenticates with a
  // Bearer API key inside each handler, not the dashboard session cookie. Let it
  // through here so that Bearer check can actually run.
  if (event.path.startsWith('/api/external/')) {
    return
  }

  // 4. Verify the session
  const sessionConfig = {
    password: process.env.SESSION_PASSWORD || 'pawbby-reborn-local-secret-32-chars!',
  }
  const session = await useSession(event, sessionConfig)
  
  if (!session.data.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Please log in to access the local dashboard'
    })
  }
  
  // Attach user ID to the context so we can use it in API routes if needed
  event.context.userId = session.data.userId
})
