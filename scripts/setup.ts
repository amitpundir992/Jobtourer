#!/usr/bin/env node
/**
 * Initial project setup for JobTourer.
 */

import { execSync } from 'child_process'
import fs from 'fs'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function exec(command: string) {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

async function checkDependencies() {
  log('\nChecking dependencies...', colors.blue)

  const checks = [
    { name: 'Node.js', command: 'node --version', required: 'v20.0.0' },
    { name: 'pnpm', command: 'pnpm --version', required: '8.0.0' },
    { name: 'Git', command: 'git --version', required: '2.0.0' },
  ]

  let allPassed = true

  for (const check of checks) {
    try {
      execSync(check.command, { stdio: 'pipe' })
      log(`OK ${check.name} found`, colors.green)
    } catch {
      log(`ERROR ${check.name} not found (required: ${check.required})`, colors.red)
      allPassed = false
    }
  }

  return allPassed
}

async function installDependencies() {
  log('\nInstalling dependencies...', colors.blue)
  return exec('pnpm install')
}

async function setupEnv() {
  log('\nSetting up environment...', colors.blue)

  const envExample = '.env.example'
  const env = '.env'

  if (!fs.existsSync(envExample)) {
    log('ERROR .env.example not found', colors.red)
    return false
  }

  if (fs.existsSync(env)) {
    log('WARN .env already exists, skipping', colors.yellow)
    return true
  }

  fs.copyFileSync(envExample, env)
  log('OK created .env file', colors.green)
  log('WARN update .env with real credentials before running production-like flows', colors.yellow)

  return true
}

async function setupDatabase() {
  log('\nSetting up database...', colors.blue)

  log('Generating Prisma client...', colors.blue)
  if (!exec('pnpm db:generate')) {
    log('ERROR failed to generate Prisma client', colors.red)
    return false
  }

  log('OK Prisma client generated', colors.green)

  const shouldMigrate = process.argv.includes('--migrate')

  if (shouldMigrate) {
    log('Running database migrations...', colors.blue)
    if (!exec('pnpm db:migrate')) {
      log('WARN database migration failed', colors.yellow)
      log('Make sure DATABASE_URL is set correctly in .env', colors.yellow)
    } else {
      log('OK database migrated', colors.green)
    }
  } else {
    log('INFO skipping migration. Run with --migrate to migrate database', colors.blue)
  }

  return true
}

async function main() {
  log('JobTourer Setup', colors.green)
  log('='.repeat(50), colors.blue)

  if (!(await checkDependencies())) {
    log('\nERROR some dependencies are missing. Install them first.', colors.red)
    process.exit(1)
  }

  if (!(await installDependencies())) {
    log('\nERROR failed to install dependencies', colors.red)
    process.exit(1)
  }

  if (!(await setupEnv())) {
    log('\nERROR failed to set up environment', colors.red)
    process.exit(1)
  }

  if (!(await setupDatabase())) {
    log('\nERROR failed to set up database', colors.red)
    process.exit(1)
  }

  log('\nSetup complete', colors.green)
  log('\nNext steps:', colors.blue)
  log('1. Update .env with your API keys and credentials')
  log('2. Run database migrations: pnpm db:migrate')
  log('3. Optional: seed database: pnpm db:seed')
  log('4. Start development server: pnpm dev')
}

main().catch((error) => {
  log(`\nERROR setup failed: ${error.message}`, colors.red)
  process.exit(1)
})
