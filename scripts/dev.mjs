/**
 * Run the frontend and the API together.
 *
 *   npm run dev:all
 *
 * Spawns both processes directly with this Node binary rather than shelling out
 * to npm twice. That avoids the npm startup cost, avoids `npm.cmd` versus `npm`
 * differences between platforms, and — most importantly — gives us real child
 * process handles, so Ctrl-C reliably takes both down instead of orphaning the
 * API on a port you then have to hunt down.
 */
import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath

const children = []
let shuttingDown = false

function run(label, args) {
  const child = spawn(node, args, { cwd: root, stdio: 'inherit' })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return

    // One half of the stack dying means the other is useless — a frontend with
    // no API silently fails every auth call, which is far more confusing than
    // an obvious shutdown.
    console.log(`\n[${label}] exited (code ${code ?? 'null'}, signal ${signal ?? 'none'}) — stopping the other process.`)
    shutdown(code ?? 1)
  })

  child.on('error', (err) => {
    console.error(`[${label}] failed to start:`, err.message)
    shutdown(1)
  })

  children.push(child)
  return child
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) child.kill()
  }

  setTimeout(() => process.exit(code), 300).unref()
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('\n  Starting LAXMI JEWELLERY (web + api)\n')

run('api', ['--watch', resolve(root, 'server', 'index.js')])
run('web', [resolve(root, 'node_modules', 'vite', 'bin', 'vite.js')])
