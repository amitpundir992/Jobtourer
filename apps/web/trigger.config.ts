import { prismaExtension } from '@trigger.dev/build/extensions/prisma'
import { defineConfig } from '@trigger.dev/sdk'

export default defineConfig({
  project: 'proj_rqoauwetfyqgeltrscyi',
  dirs: ['./trigger'],
  runtime: 'node-22',
  maxDuration: 900,
  build: {
    external: ['@prisma/client'],
    extensions: [
      prismaExtension({
        mode: 'legacy',
        schema: '../../packages/database/prisma/schema.prisma',
        version: '5.22.0',
      }),
    ],
  },
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 2_000,
      maxTimeoutInMs: 30_000,
      factor: 2,
      randomize: true,
    },
  },
})
