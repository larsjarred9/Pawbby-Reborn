export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') return { error: 'Method not allowed' }

  const body = await readBody(event)
  const { deviceId, action } = body

  if (!deviceId || !action) {
    throw new Error('Missing deviceId or action')
  }

  const nitro = useNitroApp()
  // Trigger background action
  await nitro.hooks.callHook('tuya:action' as any, { deviceId, action })

  return { success: true }
})
