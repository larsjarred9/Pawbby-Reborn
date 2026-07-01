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

  if (process.env.WEBHOOK_STRICT_MODE === 'true') {
    const allowedHosts = ['hooks.slack.com', 'discord.com', 'discordapp.com', 'canary.discord.com', 'ptb.discord.com', 'api.telegram.org', 'api.pushover.net']
    if (url.protocol !== 'https:' || !allowedHosts.includes(url.host)) {
      throw createError({ statusCode: 400, statusMessage: 'Strict mode enabled: Webhook URL must be a valid, known secure webhook (Discord, Slack, Telegram, Pushover) over HTTPS.' })
    }
  } else {
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw createError({ statusCode: 400, statusMessage: 'Webhook URL protocol must be http or https' })
    }
    const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254']);
    if (blockedHosts.has(url.hostname)) {
      throw createError({ statusCode: 400, statusMessage: 'Loopback and metadata webhook addresses are not allowed for security reasons' })
    }
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
