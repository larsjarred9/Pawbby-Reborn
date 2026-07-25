import fs from 'node:fs'
import path from 'node:path'
import prisma from '../utils/prisma'

const getDbPath = (): string => {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  if (dbUrl.startsWith('file:')) {
    return dbUrl.slice(5)
  }
  return dbUrl
}

const runBackup = async () => {
  try {
    const user = await prisma.user.findFirst()
    if (!user || !user.enableAutomatedBackups) {
      console.log('Automated backups are disabled by user.')
      return
    }

    const dbPath = getDbPath()
    const absoluteDbPath = path.resolve(process.cwd(), dbPath)
    
    if (fs.existsSync(absoluteDbPath)) {
      const backupPath = absoluteDbPath + '.backup'
      fs.copyFileSync(absoluteDbPath, backupPath)
      console.log(`[Backup] Successfully backed up database to ${backupPath}`)
    } else {
      console.warn(`[Backup] Could not find database file at ${absoluteDbPath}`)
    }
  } catch (error) {
    console.error('[Backup] Failed to run automated backup:', error)
  }
}

const scheduleNextMidnight = () => {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  
  const msUntilMidnight = midnight.getTime() - now.getTime()
  
  // Set a timeout to run exactly at midnight
  setTimeout(async () => {
    await runBackup()
    // Schedule the next one for the following midnight
    scheduleNextMidnight()
  }, msUntilMidnight)
}

export default defineNitroPlugin((nitroApp) => {
  console.log('[Backup] Initializing zero-compute midnight backup scheduler...')
  scheduleNextMidnight()
})
