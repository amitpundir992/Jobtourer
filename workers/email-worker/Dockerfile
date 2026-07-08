# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY workers/email-worker/package.json ./workers/email-worker/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter email-worker...

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workers/email-worker/node_modules ./workers/email-worker/node_modules
COPY --from=deps /app/packages ./packages
COPY workers/email-worker ./workers/email-worker
COPY tsconfig.base.json ./

# Generate Prisma client
RUN pnpm --filter @jobtourer/database db:generate

# Build the worker
RUN pnpm --filter email-worker build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker

COPY --from=builder --chown=worker:worker /app/workers/email-worker/dist ./dist
COPY --from=builder --chown=worker:worker /app/node_modules ./node_modules

USER worker

CMD ["node", "dist/index.js"]
