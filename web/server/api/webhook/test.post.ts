export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const webhookUrl = body.webhookUrl

  if (!webhookUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Webhook URL is required' })
  }

  const payload = {
    content: "✅ **PAWBBY Reborn**: Webhook push notifications are successfully configured!",
    text: "✅ *PAWBBY Reborn*: Webhook push notifications are successfully configured!"
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Failed to send webhook: ${response.statusText}`)
    }

    return { success: true }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
