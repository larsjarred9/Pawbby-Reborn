export default defineNuxtRouteMiddleware(async (to) => {
  const { data, error } = await useFetch('/api/auth/status')
  
  if (error.value || !data.value) return
  
  const { isAuthenticated, hasUser, hasPassword } = data.value
  
  const publicRoutes = ['/login', '/register', '/set-password']
  const isPublicRoute = publicRoutes.includes(to.path)

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
