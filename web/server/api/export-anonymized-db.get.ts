import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execPromise = promisify(exec)

// Simple in-memory mutex to prevent concurrent file generation/corruption
let isExporting = false

export default defineEventHandler(async (event) => {
  // Basic CSRF Protection: Ensure the request came from our own dashboard
  const referer = getHeader(event, 'referer') || ''
  const host = getHeader(event, 'host') || ''
  
  // If there's no referer or it doesn't match our host, reject it to prevent cross-site execution
  if (!referer || !referer.includes(host)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Invalid Referer'
    })
  }

  if (isExporting) {
    throw createError({
      statusCode: 429,
      statusMessage: 'An export is already in progress. Please wait a moment and try again.'
    })
  }

  try {
    isExporting = true
    
    // 1. Run the anonymization script
    const { stdout } = await execPromise('node scripts/anonymize.js', {
      cwd: process.cwd()
    })

    // 2. Locate the generated share.db
    let shareDbPath = path.resolve(process.cwd(), 'prisma/share.db')
    const match = stdout.match(/👉 You can find the safe file here: (.*)/)
    if (match && match[1]) {
      shareDbPath = match[1].trim()
    }
    
    if (!fs.existsSync(shareDbPath)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to generate anonymized database'
      })
    }

    // 3. Serve the file for download
    setHeader(event, 'Content-Disposition', 'attachment; filename="pawbby-share.db"')
    setHeader(event, 'Content-Type', 'application/x-sqlite3')
    
    const stream = fs.createReadStream(shareDbPath)
    
    // Release the lock when the stream finishes or errors out
    stream.on('close', () => { isExporting = false })
    stream.on('error', () => { isExporting = false })
    
    return sendStream(event, stream)
  } catch (error) {
    isExporting = false
    console.error('[Anonymize] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to export anonymized database'
    })
  }
})
