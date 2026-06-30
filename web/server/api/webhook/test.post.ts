export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const webhookUrl = body?.webhookUrl

  if (!webhookUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Webhook URL is required' })
  }

  let url: URL
  try {
    url = new URL(webhookUrl)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Webhook URL is invalid' })
  }

  const allowedHosts = ['hooks.slack.com', 'discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com']
  if (url.protocol !== 'https:' || !allowedHosts.includes(url.host)) {
    throw createError({ statusCode: 400, statusMessage: 'Webhook URL must be a valid Discord or Slack webhook' })
  }

  const payload = {
    content: "✅ **PAWBBY Reborn**: Webhook push notifications are successfully configured!",
    text: "✅ *PAWBBY Reborn*: Webhook push notifications are successfully configured!"
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) {
      throw new Error(`Failed to send webhook: ${response.statusText}`)
    }

    return { success: true }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
