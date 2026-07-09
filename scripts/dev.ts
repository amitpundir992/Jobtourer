#!/usr/bin/env node
/**
 * Development script for running the entire JobTourer stack.
 */

import { spawn } from 'child_process'

const processes: ReturnType<typeof spawn>[] = []

const services = [
  {
    name: 'Web',
    command: 'pnpm',
    args: ['--filter', '@jobtourer/web', 'dev'],
    color: '\x1b[36m',
  },
  {
    name: 'Search Worker',
    command: 'pnpm',
    args: ['--filter', 'search-worker', 'dev'],
    color: '\x1b[33m',
  },
  {
    name: 'Email Worker',
    command: 'pnpm',
    args: ['--filter', 'email-worker', 'dev'],
    color: '\x1b[35m',
  },
]

function log(service: string, message: string, color: string) {
  console.log(`${color}[${service}]\x1b[0m ${message}`)
}

function startService(service: (typeof services)[number]) {
  const proc = spawn(service.command, service.args, {
    stdio: 'pipe',
    shell: true,
  })

  proc.stdout?.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line: string) => line.trim())
    lines.forEach((line: string) => log(service.name, line, service.color))
  })

  proc.stderr?.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line: string) => line.trim())
    lines.forEach((line: string) => log(service.name, line, '\x1b[31m'))
  })

  proc.on('close', (code) => {
    log(service.name, `Process exited with code ${code}`, service.color)
  })

  processes.push(proc)
}

function cleanup() {
  console.log('\n\x1b[33mShutting down services...\x1b[0m')
  processes.forEach((proc) => {
    try {
      proc.kill('SIGTERM')
    } catch {
      // Ignore errors during cleanup.
    }
  })
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

console.log('\x1b[32mStarting JobTourer development environment...\x1b[0m\n')

services.forEach((service) => {
  log('System', `Starting ${service.name}...`, '\x1b[32m')
  startService(service)
})

console.log('\n\x1b[32mAll services started.\x1b[0m')
console.log('\x1b[33mPress Ctrl+C to stop all services\x1b[0m\n')
