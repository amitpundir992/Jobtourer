# JobTourer

AI-powered job application automation platform.

JobTourer searches for jobs, matches them against resumes, generates application email drafts, and tracks applications from one dashboard.

## Features

- Automated job search across multiple sources
- AI resume-to-job matching
- Personalized email draft generation
- Resume management
- Application tracking
- Subscription-ready product structure
- Background workers for search and email automation

## Tech Stack

- Next.js 15 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Redis
- BullMQ
- pnpm workspaces

## Project Structure

```txt
jobtourer/
|-- apps/
|   `-- web/                  # Next.js web app and API routes
|-- packages/
|   |-- config/               # Shared constants and validation
|   |-- database/             # Prisma schema, client, and seed
|   |-- types/                # Shared TypeScript types
|   `-- ui/                   # Shared UI components
|-- workers/
|   |-- email-worker/         # Email draft automation
|   `-- search-worker/        # Job search automation
|-- scripts/                  # Local setup/dev/migration scripts
|-- Dockerfile                # Web production image
|-- docker-compose.yml
|-- pnpm-workspace.yaml
`-- tsconfig.base.json
```

Internal packages use scoped workspace names:

```txt
@jobtourer/web
@jobtourer/config
@jobtourer/database
@jobtourer/types
@jobtourer/ui
```

## Prerequisites

- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 15
- Redis >= 7

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

The web app runs at `http://localhost:3000`.

## Scripts

```bash
pnpm dev              # Start web app and workers
pnpm dev:web          # Start the Next.js app only
pnpm dev:workers      # Start all workers
pnpm build            # Build the web app
pnpm build:workers    # Build workers
pnpm start            # Start the production web app
pnpm start:workers    # Start workers
pnpm typecheck        # Run TypeScript checks
pnpm lint             # Run linting
pnpm format           # Format files
pnpm format:check     # Check formatting in CI
pnpm test             # Run tests
```

## Database

```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed local data
```

## Environment

Create `.env` from `.env.example` and fill the required values.

Common required values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jobtourer"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="replace-with-a-secure-secret"
ENCRYPTION_KEY="32-character-encryption-key-here"
```

Add AI, Gmail, storage, OAuth, and Stripe keys only for the features you are enabling locally.

## Docker

The root `Dockerfile` builds the web app from `apps/web` using Next.js standalone output.

```bash
docker build -t jobtourer-web .
docker run --env-file .env -p 3000:3000 jobtourer-web
```

## Deployment

- Web: deploy `apps/web` to Vercel or build the root Dockerfile.
- Database: use a managed PostgreSQL provider such as Neon, Supabase, Railway, or Render.
- Redis: use a managed Redis provider such as Upstash.
- Workers: deploy `workers/search-worker` and `workers/email-worker` as separate background services.

## Notes

- `packages/` is intentional. It contains reusable internal workspace libraries.
- `apps/web/src/app` is intentional. It is the Next.js App Router directory inside the web application.
- Keep `pnpm-lock.yaml` committed so CI and Docker builds are reproducible.
