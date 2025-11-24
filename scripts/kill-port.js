import { execSync } from 'child_process'
import { argv } from 'process'

const port = argv[2] || '3000'

console.log(`🔍 Checking for processes on port ${port}...`)

try {
  // Find all processes using the port (macOS/Linux)
  const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: 'pipe' })
    .trim()
    .split('\n')
    .filter(Boolean)
  
  if (pids.length === 0 || !pids[0]) {
    console.log(`✅ No process found on port ${port}`)
    process.exit(0)
  }

  // Get process info
  try {
    const processInfo = execSync(`lsof -i:${port}`, { encoding: 'utf8' })
    console.log(`📋 Found ${pids.length} process(es) on port ${port}:`)
    console.log(processInfo)
  } catch (e) {
    // Process might have been killed already
  }

  // Kill all processes
  console.log(`\n🔄 Killing process(es)...`)
  pids.forEach(pid => {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' })
      console.log(`   ✅ Killed process ${pid}`)
    } catch (error) {
      console.log(`   ⚠️  Process ${pid} may have already terminated`)
    }
  })
  
  console.log(`\n✅ All processes on port ${port} have been terminated`)
} catch (error) {
  if (error.status === 1 || error.code === 'ENOENT') {
    // No process found (lsof returns 1 when no match)
    console.log(`✅ No process found on port ${port}`)
  } else {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

