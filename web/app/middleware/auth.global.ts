const PUBLIC_ROUTES = ['/login', '/register', '/set-password']

export default defineNuxtRouteMiddleware(async (to) => {
  const { data, error } = await useFetch('/api/auth/status')
  
  if (error.value || !data.value) {
    // Fail closed: if we can't verify auth status, do not allow access to protected routes
    if (!PUBLIC_ROUTES.includes(to.path)) {
      return navigateTo('/login')
    }
    return
  }
  
  const { isAuthenticated, hasUser, hasPassword } = data.value
  
  const isPublicRoute = PUBLIC_ROUTES.includes(to.path)

  if (isAuthenticated) {
    // If logged in and trying to access an auth page, redirect home
    if (isPublicRoute) return navigateTo('/')
    return
  }

  // Not authenticated
  if (isPublicRoute) {
    // Make sure they are on the right public route based on state
    if (!hasUser && to.path !== '/register') return navigateTo('/register')
    if (hasUser && !hasPassword && to.path !== '/set-password') return navigateTo('/set-password')
    if (hasUser && hasPassword && to.path !== '/login') return navigateTo('/login')
    return // They are on the correct public route
  }

  // Not authenticated and trying to access a protected route like '/' or '/settings'
  if (!hasUser) return navigateTo('/register')
  if (hasUser && !hasPassword) return navigateTo('/set-password')
  return navigateTo('/login')
})
