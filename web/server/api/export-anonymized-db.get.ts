import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execPromise = promisify(exec)

export default defineEventHandler(async (event) => {
  try {
    // 1. Run the anonymization script
    await execPromise('node scripts/anonymize.js', {
      cwd: process.cwd()
    })

    // 2. Locate the generated share.db
    const shareDbPath = path.resolve(process.cwd(), 'prisma/share.db')
    
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
    
    return sendStream(event, stream)
  } catch (error) {
    console.error('[Anonymize] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to export anonymized database'
    })
  }
})
