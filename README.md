# JobTourer

JobTourer is a production-oriented job discovery and application workflow platform. It collects jobs from public company boards, scores them against a candidate profile and parsed resume, stores personalized recommendations, and can prepare reviewable Gmail drafts with the selected resume attached.

The system is designed around one important boundary: JobTourer automates discovery and draft preparation, while the user remains in control of reviewing and sending applications.

## Current Capabilities

- Email/password, Google, and GitHub authentication with Better Auth
- Thirty-day database-backed sessions with daily session renewal
- Candidate profile and job-preference management
- PDF and DOCX resume upload, parsing, and private Supabase storage
- Real job ingestion from Remote OK, Greenhouse, Lever, Ashby, and SmartRecruiters
- Deterministic resume/profile-to-job scoring and duplicate detection
- Server-side filtering, sorting, and pagination for recommendations
- Manual and scheduled automation through Trigger.dev
- Daily, weekly, and monthly schedules with timezone support
- Internal application draft generation with optional AI enhancement
- Gmail OAuth integration and encrypted refresh-token storage
- Gmail draft creation only when a published hiring email is available
- Application dashboard, run history, responsive navigation, and light/dark themes

Google Search, LinkedIn, Indeed, Glassdoor, and Wellfound are not currently connected. Their names should not be presented as active sources until a compliant API or approved integration is implemented.

## Architecture

```text
Browser
  |
  v
Next.js application (UI, protected routes, API handlers)
  |-- Better Auth --------------------------> Google / GitHub OAuth
  |-- Prisma -------------------------------> Neon PostgreSQL
  |-- Resume upload ------------------------> Supabase private bucket
  |-- Job connectors -----------------------> Public ATS/job-board APIs
  |-- Trigger.dev SDK ----------------------> Trigger.dev Cloud
  `-- Gmail OAuth/API ----------------------> Reviewable Gmail drafts

Trigger.dev task
  |-- fetch and normalize jobs
  |-- score jobs against profile + resume
  |-- upsert jobs and recommendations
  |-- generate internal drafts
  `-- create Gmail drafts when a hiring email exists
```

### Automation Lifecycle

1. A user completes a profile and uploads a default resume.
2. The user starts a run manually or enables a daily, weekly, or monthly schedule.
3. Trigger.dev executes the job-search task outside the web request lifecycle.
4. Connectors are queried independently. A failed source does not discard successful source results.
5. Jobs are normalized and deduplicated using stable identifiers and SHA-256 fingerprints.
6. Relevant jobs are scored using role, skills, location, work preference, and salary signals.
7. Jobs meeting the configured threshold are persisted as recommendations.
8. Up to ten application drafts are prepared per run.
9. Gmail drafts are created only for jobs that expose a suitable hiring address. Missing-email jobs are skipped without failing the run.
10. Counts and errors are recorded in `AutomationRun` for visibility in Settings.

Trigger.dev must execute a run before the system can know that no matches exist. A successful zero-match run therefore ends as `completed` with zero recommendations and zero drafts.

## Technology

| Area | Implementation |
| --- | --- |
| Web | Next.js 15 App Router, React 18, TypeScript |
| UI | Tailwind CSS, Radix UI, Lucide, next-themes |
| Authentication | Better Auth with Prisma adapter |
| Database | PostgreSQL (Neon in production), Prisma 5 |
| Automation | Trigger.dev v4 |
| Resume storage | Private Supabase Storage bucket |
| Resume parsing | `pdf-parse` and Mammoth |
| Email | Gmail OAuth 2.0 and Gmail Drafts API |
| AI drafts | Gemini, OpenAI, or Anthropic with template fallback |
| Monorepo | pnpm workspaces |
| Quality | TypeScript, ESLint, Prettier, GitHub Actions |

## Repository Layout

```text
.
|-- apps/
|   `-- web/
|       |-- src/app/             # App Router pages and protected API handlers
|       |-- src/components/      # Product UI and feature components
|       |-- src/lib/             # Auth, matching, storage, and automation logic
|       |-- trigger/             # Trigger.dev task definitions
|       `-- trigger.config.ts    # Trigger.dev runtime/build configuration
|-- packages/
|   |-- config/                  # Shared configuration and token encryption
|   |-- database/                # Prisma client and schema
|   |-- types/                   # Shared domain types
|   `-- ui/                      # Shared UI primitives
|-- workers/
|   |-- search-worker/           # Optional legacy BullMQ search worker
|   `-- email-worker/            # Optional legacy BullMQ email worker
|-- scripts/                     # Development and migration helpers
|-- .github/workflows/ci.yml     # Quality, build, and test pipeline
`-- pnpm-workspace.yaml
```

The Trigger.dev tasks under `apps/web/trigger` are the primary automation path. The Redis/BullMQ workers remain available for the older worker deployment model but are not required for the current Trigger.dev flow.

## Prerequisites

- Node.js 22 LTS recommended (minimum supported version: 20)
- pnpm 8.15 or newer within the pnpm 8 line
- PostgreSQL database
- Trigger.dev account and project
- Supabase project for resume storage
- Google Cloud OAuth client for Gmail integration
- Optional Google and GitHub OAuth clients for social sign-in
- Optional Gemini, OpenAI, or Anthropic API key for AI-written drafts

## Local Development

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Configure the environment

Create a root `.env` file. Environment files are ignored by Git and must never be committed.

At minimum, local development requires the database, application URL, Better Auth secret, Supabase storage credentials, and Trigger.dev credentials. Add provider-specific variables only for the integrations being exercised.

### 3. Generate the Prisma client and apply the schema

```bash
pnpm db:generate
pnpm db:push
```

Use migrations for controlled schema changes:

```bash
pnpm db:migrate
```

### 4. Start the web application

```bash
pnpm dev:web
```

The application is available at `http://localhost:3000`. If that port is occupied, Next.js selects the next available port; update local OAuth redirect URLs accordingly.

### 5. Start the Trigger.dev worker

Run this in a second terminal:

```bash
pnpm trigger:dev
```

A development Trigger secret (`tr_dev_...`) sends runs to the local Trigger.dev worker. Without this process, manual runs remain queued in development.

## Environment Variables

### Core application

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical application origin, for example `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | No | Explicit API origin when it differs from the app origin |
| `BETTER_AUTH_URL` | Yes | Better Auth base URL; normally the same as the application URL |
| `BETTER_AUTH_SECRET` | Yes | High-entropy server-side authentication secret |

### Login providers

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | For Google login | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | For GitHub login | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | For GitHub login | GitHub OAuth client secret |

Better Auth callback URLs use the application origin, including `/api/auth/callback/google` and `/api/auth/callback/github`.

### Resume storage

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key used to manage private resume objects |
| `SUPABASE_RESUME_BUCKET` | No | Private bucket name; defaults to `resumes` |

`SUPABASE_SERVICE_ROLE_KEY` must remain server-side. Do not rename it with a `NEXT_PUBLIC_` prefix.

### Trigger.dev

| Variable | Required | Purpose |
| --- | --- | --- |
| `TRIGGER_PROJECT_REF` | Yes | Trigger.dev project reference |
| `TRIGGER_SECRET_KEY` | Yes | Development or production Trigger.dev secret |

Use a development secret locally and a production secret in Vercel and Trigger.dev Cloud. Deploy tasks after changing task code or Trigger configuration:

```bash
pnpm trigger:deploy
```

### Gmail drafts

| Variable | Required | Purpose |
| --- | --- | --- |
| `GMAIL_CLIENT_ID` | For Gmail | Google OAuth client ID with Gmail API access |
| `GMAIL_CLIENT_SECRET` | For Gmail | Google OAuth client secret |
| `GMAIL_REDIRECT_URI` | For Gmail | Exact callback URL ending in `/api/auth/gmail/callback` |
| `TOKEN_ENCRYPTION_KEY` | For Gmail | Base64-encoded 32-byte AES-256-GCM key |

Generate the token-encryption key with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The Google OAuth consent screen must include the user as a test user while the app remains in testing mode. The Gmail API must be enabled and the redirect URI must match exactly.

### Draft generation

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_PROVIDER` | No | `gemini`, `openai`, `claude`, or `template` |
| `GOOGLE_GEMINI_API_KEY` | For Gemini | Gemini API key |
| `OPENAI_API_KEY` | For OpenAI | OpenAI API key |
| `ANTHROPIC_API_KEY` | For Claude | Anthropic API key |

When no configured AI call succeeds, the automation uses a conservative template and never invents candidate experience.

### Job-source customization

| Variable | Required | Purpose |
| --- | --- | --- |
| `GREENHOUSE_BOARD_TOKENS` | No | Comma-separated Greenhouse board tokens |
| `LEVER_SITE_NAMES` | No | Comma-separated Lever site names |
| `ASHBY_BOARD_NAMES` | No | Comma-separated Ashby board names |
| `SMARTRECRUITERS_COMPANIES` | No | Comma-separated SmartRecruiters company identifiers |

Defaults are defined in `apps/web/src/lib/job-recommendations.ts`. Preferred companies from the user profile are also considered as possible ATS identifiers.

### Optional legacy workers

| Variable | Required | Purpose |
| --- | --- | --- |
| `REDIS_URL` | Legacy workers only | Redis connection string for BullMQ |
| `LOG_LEVEL` | No | Worker logging verbosity |

Redis is not required by the primary Trigger.dev automation workflow.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev:web` | Start the Next.js development server |
| `pnpm trigger:dev` | Start the local Trigger.dev worker |
| `pnpm trigger:deploy` | Deploy Trigger.dev tasks |
| `pnpm dev:workers` | Start optional BullMQ workers |
| `pnpm build` | Build the web application |
| `pnpm build:workers` | Build optional workers |
| `pnpm typecheck` | Type-check all workspace packages |
| `pnpm lint` | Lint workspace packages |
| `pnpm format:check` | Validate formatting without modifying files |
| `pnpm test` | Run workspace tests |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:push` | Synchronize the schema in development |
| `pnpm db:migrate` | Create and apply a development migration |
| `pnpm db:studio` | Open Prisma Studio |

Before opening a pull request, run:

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Production Deployment

### Vercel

Use the following project settings for the web application:

- Framework preset: `Next.js`
- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @jobtourer/database db:generate && pnpm build`
- Output directory: leave unset and use the Next.js default

Add the required environment variables to Production, Preview, and Development as appropriate. Production OAuth URLs must use the final HTTPS deployment origin, then be updated in Google Cloud, GitHub, Better Auth, and Gmail configuration.

Vercel's Git integration deploys the web application. The GitHub Actions workflow validates quality, build, and tests but does not require a separate Vercel token.

### Trigger.dev Cloud

1. Add the same server-side database, storage, Gmail, encryption, AI, and application URL variables to the Trigger.dev production environment.
2. Use the production Trigger secret in Vercel.
3. Deploy tasks with `pnpm trigger:deploy`.
4. Verify the deployed task version in the Trigger.dev dashboard.
5. Run one manual automation from Settings and confirm that `AutomationRun` reaches `completed`.

### Database changes

Production schema changes should be represented by reviewed Prisma migrations and applied with:

```bash
pnpm --filter @jobtourer/database exec prisma migrate deploy
```

Do not use `prisma db push` as the production migration strategy.

## Security and Operational Notes

- Every profile, resume, job, integration, and automation endpoint verifies the authenticated user.
- Better Auth sessions expire after 30 days and are renewed after 24 hours of activity.
- Gmail refresh tokens are encrypted with AES-256-GCM before database storage.
- Resumes are stored in a private Supabase bucket and downloaded server-side.
- Service-role keys, OAuth secrets, Trigger secrets, database URLs, and encryption keys must never enter client bundles or Git history.
- Automation uses idempotency keys and job fingerprints to limit duplicate processing.
- Source failures are isolated with `Promise.allSettled`; inspect Trigger.dev logs and `AutomationRun.error` when a run fails.
- Gmail drafts are never created without a discovered recipient address, and drafts are not sent automatically.
- Rotate any secret immediately if it appears in logs, screenshots, commits, or pull-request output.

## Troubleshooting

### Automation remains queued locally

Start `pnpm trigger:dev` and confirm that `.env` contains a `tr_dev_...` Trigger secret for the same project.

### A run completes with zero matches

This is valid. Review the profile, parsed resume, preferred locations, and minimum-match threshold. The run still had to scan and score jobs before returning zero.

### Gmail returns `403 access_denied`

Add the Google account under OAuth consent-screen test users, enable the Gmail API, and verify the exact redirect URI.

### Gmail drafts remain at zero

Connect Gmail, enable Gmail draft creation, and remember that a draft is created only when the job posting includes a published hiring email.

### Resume upload fails

Confirm the Supabase URL and service-role key, ensure the configured bucket can be created or accessed, and upload a PDF or DOCX no larger than 10 MB.

### Prisma fails inside Trigger.dev

Keep `@trigger.dev/build`, `@trigger.dev/sdk`, and `trigger.dev` on compatible pinned versions. The Trigger configuration uses the Prisma legacy extension because this repository uses Prisma 5 with `prisma-client-js`.

## Contributing

Keep changes focused, preserve workspace boundaries, and include tests for behavior with meaningful risk. Never commit `.env`, `.trigger`, uploaded resumes, generated build output, or credentials. Commit `pnpm-lock.yaml` whenever dependencies change so local, CI, Vercel, and Trigger.dev builds remain reproducible.
