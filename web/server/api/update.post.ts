import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
  // Guard against environments where updates should not run (e.g. Docker)
  if (process.env.DISABLE_UPDATES === 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Updates are disabled on this instance' })
  }

  // CSRF Protection: Basic Origin/Referer check to prevent malicious cross-site POSTs
  const reqOrigin = getHeader(event, 'origin') || getHeader(event, 'referer')
  const host = getHeader(event, 'host')
  
  if (reqOrigin && host) {
    try {
      const originUrl = new URL(reqOrigin)
      if (originUrl.host !== host) {
        throw createError({ statusCode: 403, statusMessage: 'Cross-origin request blocked' })
      }
    } catch (e) {
      // Invalid URL
    }
  }

  // We don't want to await the script completely because if it restarts PM2,
  // the server will close the connection before returning the response.
  // We'll spawn it detached.
  
  // process.cwd() is usually the `web` folder.
  // We want to run the script from the repository root.
  const rootPath = path.resolve(process.cwd(), '..')
  
  if (!fs.existsSync(path.join(rootPath, 'upgrade.sh'))) {
    throw createError({ statusCode: 500, statusMessage: 'Upgrade script not found at repository root' })
  }
  
  const child = spawn('bash', ['./upgrade.sh'], {
    cwd: rootPath,
    detached: true,
    stdio: 'ignore'
  })
  
  child.unref() // Let the Node.js event loop not wait for this child
  
  return { success: true, message: 'Update started' }
})
