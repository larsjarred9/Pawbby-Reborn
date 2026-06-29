import { execSync } from 'child_process'

export default defineEventHandler(async (event) => {
  // If the developer disabled updates in .env, just return false immediately
  if (process.env.DISABLE_UPDATES === 'true') {
    return { updateAvailable: false, disabled: true }
  }

  try {
    // 1. Get the local commit hash
    // We execute git rev-parse HEAD in the root directory (one level up from web)
    const localHashBuffer = execSync('git rev-parse HEAD', { cwd: process.cwd() + '/..' })
    const localHash = localHashBuffer.toString().trim()

    // 2. Get the latest remote commit hash from GitHub API
    // We use the GitHub API to avoid doing a full 'git fetch' on the user's machine, which can be slow and write to disk
    const response = await fetch('https://api.github.com/repos/larsjarred9/Pawby-Reborn/commits/main', {
      headers: {
        'User-Agent': 'Pawbby-Reborn-Local-Server',
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      console.error('[Update Checker] Failed to fetch from GitHub API:', response.statusText)
      return { updateAvailable: false, error: 'Failed to reach GitHub' }
    }

    const data = await response.json()
    const remoteHash = data.sha

    // If local hash doesn't match the remote main branch hash, an update is available!
    const updateAvailable = localHash !== remoteHash

    return {
      updateAvailable,
      localHash,
      remoteHash
    }
  } catch (error) {
    console.error('[Update Checker] Error checking for updates:', error)
    return { updateAvailable: false, error: String(error) }
  }
})
