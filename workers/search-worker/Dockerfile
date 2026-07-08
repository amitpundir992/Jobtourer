# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY workers/search-worker/package.json ./workers/search-worker/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter search-worker...

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workers/search-worker/node_modules ./workers/search-worker/node_modules
COPY --from=deps /app/packages ./packages
COPY workers/search-worker ./workers/search-worker
COPY tsconfig.base.json ./

# Generate Prisma client
RUN pnpm --filter @jobtourer/database db:generate

# Build the worker
RUN pnpm --filter search-worker build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker

COPY --from=builder --chown=worker:worker /app/workers/search-worker/dist ./dist
COPY --from=builder --chown=worker:worker /app/node_modules ./node_modules

USER worker

CMD ["node", "dist/index.js"]
