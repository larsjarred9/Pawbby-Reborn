import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const updatesDisabled = process.env.DISABLE_UPDATES === 'true'

  try {
    // 1. Get the local version from package.json
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    const localPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const localVersion = localPkg.version

    // 2. Get the latest release from GitHub
    const response = await fetch('https://api.github.com/repos/larsjarred9/Pawbby-Reborn/releases/latest', {
      headers: {
        'User-Agent': 'Pawbby-Reborn-Local-Server',
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      console.error('[Update Checker] Failed to fetch from GitHub:', response.statusText)
      return { updateAvailable: false, error: 'Failed to reach GitHub' }
    }

    const remoteRelease = await response.json()
    // Extract version from tag (e.g. 'v0.5.5' -> '0.5.5')
    const remoteVersion = remoteRelease.tag_name ? remoteRelease.tag_name.replace(/^v/, '') : null

    if (!remoteVersion) {
      return { updateAvailable: false, error: 'No releases found on GitHub' }
    }

    // If local version doesn't match the remote main branch version, an update is available!
    const updateAvailable = localVersion !== remoteVersion

    return {
      updateAvailable,
      localVersion,
      remoteVersion,
      disabled: updatesDisabled
    }
  } catch (error) {
    console.error('[Update Checker] Error checking for updates:', error)
    return { updateAvailable: false, error: String(error) }
  }
})
