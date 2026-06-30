import { spawn } from 'child_process'
import path from 'path'

export default defineEventHandler(async (event) => {
  // We don't want to await the script completely because if it restarts PM2,
  // the server will close the connection before returning the response.
  // We'll spawn it detached.
  
  const isDev = process.env.NODE_ENV === 'development'
  
  // process.cwd() is usually the `web` folder.
  // We want to run the script from the repository root.
  const rootPath = path.resolve(process.cwd(), '..')
  
  const child = spawn('bash', ['./upgrade.sh'], {
    cwd: rootPath,
    detached: true,
    stdio: 'ignore'
  })
  
  child.unref() // Let the Node.js event loop not wait for this child
  
  return { success: true, message: 'Update started' }
})
