import { useState } from '#app'

export const useAuthState = () => {
  const isAdmin = useState<boolean>('auth-is-admin', () => false)
  return { isAdmin }
}
