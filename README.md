# JobTourer

JobTourer is a job discovery and application workflow platform that helps candidates find relevant opportunities, organize recommendations, and prepare application drafts from one workspace.

The application searches supported job boards, compares openings with the user's profile and resume, and presents ranked recommendations. It can also prepare reviewable email drafts for suitable jobs while leaving the final decision and sending action with the user.

## What JobTourer Can Do

- Register and sign in with email, Google, or GitHub
- Maintain a candidate profile and job preferences
- Upload and replace a primary PDF or DOCX resume
- Extract skills, experience, education, and projects from a resume
- Search real jobs from supported public job-board sources
- Compare jobs with profile and resume information
- Rank recommendations using a match score
- Filter, sort, search, and paginate job recommendations
- Track applications and recent activity
- Generate personalized internal application drafts
- Create reviewable Gmail drafts when a hiring email is available
- Run job discovery manually or on a configurable schedule
- Review automation history and result counts
- Use the application in light or dark mode
- Navigate the complete dashboard on desktop and mobile

## Supported Job Sources

JobTourer currently collects jobs from:

- Remote OK
- Greenhouse job boards
- Lever job boards
- Ashby job boards
- SmartRecruiters job boards

Other portals such as LinkedIn, Indeed, Glassdoor, Google Jobs, and Wellfound are not currently connected.

## How Automation Works

1. The user completes a profile and uploads a primary resume.
2. The user chooses a minimum match score and an automation schedule.
3. A run starts manually or at the configured daily, weekly, or monthly time.
4. JobTourer collects and normalizes jobs from all supported sources.
5. Duplicate and irrelevant jobs are removed.
6. Remaining jobs are scored using role, skills, location, work preference, and salary information.
7. Qualified jobs are saved as recommendations.
8. Application drafts are prepared for the strongest matches.
9. Gmail drafts are created only when Gmail is connected and the job includes a published hiring email.
10. The run records how many jobs were scanned, matched, and used to create drafts.

A run can complete successfully with zero matches. The automation must search and score jobs before it can determine that none meet the selected threshold.

## Technology Stack

| Area | Technology |
| --- | --- |
| Web application | Next.js 15, React 18, TypeScript |
| Styling and UI | Tailwind CSS, Radix UI, Lucide |
| Authentication | Better Auth |
| Database | PostgreSQL and Prisma |
| Automation | Trigger.dev |
| Resume storage | Supabase Storage |
| Resume parsing | PDF and DOCX parsing libraries |
| Email drafts | Gmail API |
| Monorepo | pnpm workspaces |
| Code quality | TypeScript, ESLint, Prettier, GitHub Actions |

## Project Structure

```text
jobtourer/
|-- apps/
|   `-- web/                       # Next.js application and API routes
|       |-- src/app/              # Pages, layouts, and API handlers
|       |-- src/components/       # Feature and interface components
|       |-- src/lib/              # Application services and domain logic
|       `-- trigger/              # Scheduled automation tasks
|-- packages/
|   |-- config/                   # Shared configuration utilities
|   |-- database/                 # Prisma schema and database client
|   |-- types/                    # Shared TypeScript types
|   `-- ui/                       # Shared UI components
|-- workers/                      # Optional background-worker packages
|-- scripts/                      # Development utilities
|-- .github/workflows/            # Continuous-integration workflows
|-- package.json
`-- pnpm-workspace.yaml
```

## Requirements

Install the following before running JobTourer:

- Node.js 22 LTS
- pnpm 8 or newer
- PostgreSQL database

The complete application also requires accounts for the external services used by authentication, resume storage, automation, and Gmail drafts.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/amitpundir992/Jobtourer.git
cd Jobtourer
```

### 2. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 3. Configure local services

Create a root `.env` file and add the configuration required for the services you intend to use. Keep this file private and never commit it to Git.

At minimum, configure:

- A PostgreSQL database
- The local application URL
- Authentication
- Resume storage
- Background automation

Gmail, social login, and AI-assisted drafting can be configured when those features are needed.

### 4. Prepare the database

Generate the Prisma client:

```bash
pnpm db:generate
```

Apply the current schema to a development database:

```bash
pnpm db:push
```

### 5. Start the web application

```bash
pnpm dev:web
```

Open `http://localhost:3000` in a browser. Next.js may select another port when port 3000 is already occupied.

### 6. Start local automation

Open a second terminal in the project directory and run:

```bash
pnpm trigger:dev
```

Keep this process running while testing manual or scheduled automation locally.

## Development Commands

| Command | Description |
| --- | --- |
| `pnpm dev:web` | Start the Next.js development server |
| `pnpm trigger:dev` | Start local automation tasks |
| `pnpm dev:workers` | Start the optional worker packages |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:push` | Apply the schema to a development database |
| `pnpm db:migrate` | Create and apply a development migration |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm lint` | Run ESLint |
| `pnpm format:check` | Check repository formatting |
| `pnpm test` | Run workspace tests |
| `pnpm build` | Create a production web build |

## Verify a Change

Run the quality checks before opening a pull request:

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

## Production Deployment

The web application can be deployed as a Next.js project. The repository is structured as a monorepo, and the web application is located in `apps/web`.

A complete production deployment includes:

1. The Next.js web application
2. A managed PostgreSQL database
3. Private resume storage
4. Deployed Trigger.dev tasks
5. Configured authentication providers
6. Optional Gmail and AI integrations

Store production configuration in the deployment platform's encrypted environment settings. Do not place credentials in source files, documentation, screenshots, or Git history.

After deploying the web application, deploy the automation tasks:

```bash
pnpm trigger:deploy
```

Verify the deployment by completing a profile, uploading a resume, running automation manually, and confirming that the run reaches a completed state.

## Application Behavior

### Job matching

Recommendations are based on information from the candidate profile and parsed resume. A higher minimum match value produces fewer, more selective recommendations.

### Resume management

The application currently maintains one primary resume per user. Uploading another resume replaces the primary file and updates its parsed information.

### Email drafts

JobTourer creates drafts for review; it does not automatically send applications. Jobs without a suitable recipient email remain valid recommendations but do not produce Gmail drafts.

### Scheduled runs

Scheduling can be disabled or configured to run daily, on selected weekdays, or on a selected day of the month. Manual runs remain available independently of the saved schedule.

## Troubleshooting

### Automation remains queued locally

Confirm that the local Trigger.dev process is running in a second terminal.

### No job matches are found

Review the preferred role, skills, locations, parsed resume, and minimum match score. A completed run with zero matches is valid behavior.

### Resume parsing returns no information

Use a text-based PDF or DOCX file no larger than 10 MB. Image-only or scanned documents may not contain extractable text.

### Gmail drafts are not created

Confirm that Gmail is connected and Gmail draft creation is enabled. Drafts are created only for matched jobs with an available hiring email.

## Contributing

- Keep changes focused on the requested behavior.
- Follow the existing workspace and feature boundaries.
- Add tests for meaningful behavior changes.
- Run all quality checks before submitting changes.
- Commit the lockfile when dependencies change.
- Never commit local environment files, generated output, uploaded resumes, or credentials.
