import fs from 'fs'
import path from 'path'

export default defineCachedEventHandler(async (event) => {
  const updatesDisabled = process.env.DISABLE_UPDATES === 'true'

  try {
    // 1. Get the local version from package.json
    const packageJsonPath = path.resolve(process.cwd(), 'package.json')
    const localPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const localVersion = localPkg.version

    // 2. Get the latest release from GitHub (with 5 second timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch('https://api.github.com/repos/larsjarred9/Pawbby-Reborn/releases/latest', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Pawbby-Reborn-Local-Server',
        'Cache-Control': 'no-cache'
      }
    })
    clearTimeout(timeoutId)

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

    // Helper to check if remote is strictly newer than local (e.g. 0.6.2 vs 0.5.0)
    const isNewer = (remote: string, local: string) => {
      const r = remote.split('.').map(Number)
      const l = local.split('.').map(Number)
      for (let i = 0; i < 3; i++) {
        if (r[i] > l[i]) return true
        if (r[i] < l[i]) return false
      }
      return false
    }

    const updateAvailable = isNewer(remoteVersion, localVersion)

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
}, {
  maxAge: 60 * 60, // Cache for 1 hour to prevent GitHub API rate limits
  name: 'github-latest-release',
  getKey: () => 'latest'
})
