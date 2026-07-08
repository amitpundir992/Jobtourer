#!/usr/bin/env node
/**
 * Prisma migration helper for the database package.
 */

import { execSync } from 'child_process'

const args = process.argv.slice(2)
const command = args[0] || 'dev'

const commands: Record<string, string> = {
  dev: 'prisma migrate dev',
  deploy: 'prisma migrate deploy',
  status: 'prisma migrate status',
  reset: 'prisma migrate reset',
}

function log(message: string, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`)
}

function exec(cmd: string) {
  try {
    execSync(cmd, { stdio: 'inherit', cwd: 'packages/database' })
    return true
  } catch {
    return false
  }
}

async function main() {
  const migrationCommand = commands[command]

  if (!migrationCommand) {
    log(`ERROR unknown command: ${command}`, '\x1b[31m')
    log('\nAvailable commands:', '\x1b[33m')
    Object.keys(commands).forEach((cmd) => log(`  - ${cmd}`))
    process.exit(1)
  }

  log(`\nRunning database migration: ${command}`, '\x1b[36m')

  if (!exec(migrationCommand)) {
    log('\nERROR migration failed', '\x1b[31m')
    process.exit(1)
  }

  log('\nMigration complete', '\x1b[32m')
}

main().catch((error) => {
  log(`\nERROR migration failed: ${error.message}`, '\x1b[31m')
  process.exit(1)
})
