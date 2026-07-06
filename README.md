# JobTourer 🚀

**AI-Powered Job Application Automation Platform**

Jobtourer automates your job search by searching for jobs nightly, matching them with your resume, generating personalized emails, and creating drafts so you can send them at optimal times.

---

## 🌟 Features

- **Automated Job Search** - Searches multiple platforms nightly (Greenhouse, Lever, RemoteOK, Hacker News, Reddit, Company career pages)
- **AI Resume Matching** - Matches jobs with your resume and calculates compatibility scores
- **Smart Email Generation** - Generates personalized application emails using AI
- **Draft Management** - Saves email drafts with resume attachments
- **Multiple Resume Support** - Manage and automatically select the best resume for each job
- **Application Tracking** - Track all your applications in one dashboard
- **Analytics** - Insights on application success rates and trends
- **Subscription Tiers** - Free, Pro, and Premium plans with Stripe integration

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Query** - Data fetching
- **Zustand** - State management

### Backend
- **Express.js** - REST API
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Cache and queues
- **BullMQ** - Background jobs

### AI & Automation
- **OpenAI / Gemini / Claude** - AI text generation
- **Trigger.dev** - Workflow orchestration
- **Custom Automation Engine** - Job matching and scheduling

### External Services
- **Gmail API** - Email drafts and sending
- **Cloudflare R2 / AWS S3** - Resume storage
- **Stripe** - Payments
- **Better Auth** - Authentication

---

## 📁 Project Structure

```
applypilot/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express backend
├── packages/
│   ├── database/            # Prisma schema
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configs
├── workers/
│   ├── search-worker/       # Job search automation
│   └── email-worker/        # Email draft generation
└── scripts/                 # Utility scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** >= 15
- **Redis** >= 7.0
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd applypilot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials (see Environment Variables section below)

4. **Setup database**
   ```bash
   # Generate Prisma client
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   
   # Seed database (optional)
   pnpm db:seed
   ```

5. **Start development servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individually
   pnpm dev:web    # Frontend: http://localhost:3000
   pnpm dev:api    # Backend: http://localhost:4000
   ```

---

## 🔐 Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/applypilot"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="generate-a-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Services (choose at least one)
OPENAI_API_KEY="sk-..."
GOOGLE_GEMINI_API_KEY="..."
ANTHROPIC_API_KEY="..."

# Gmail API
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/auth/gmail/callback"

# Storage (Cloudflare R2 or AWS S3)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="auto"
AWS_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_BUCKET_NAME="applypilot-resumes"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Trigger.dev (optional)
TRIGGER_API_KEY="tr_..."
TRIGGER_API_URL="https://api.trigger.dev"

# App URLs
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Security
JWT_SECRET="generate-another-random-secret"
ENCRYPTION_KEY="32-character-encryption-key-here"

# Node Environment
NODE_ENV="development"
```

### How to Get API Keys

#### 1. **Google OAuth** (for login)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### 2. **GitHub OAuth** (for login)
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### 3. **Gmail API** (for email drafts)
   - Same Google Cloud project as above
   - Enable Gmail API
   - Use same OAuth credentials
   - Add scope: `https://www.googleapis.com/auth/gmail.compose`

#### 4. **OpenAI API**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Create API key in dashboard

#### 5. **Google Gemini**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create API key

#### 6. **Stripe**
   - Sign up at [Stripe](https://stripe.com/)
   - Get test keys from dashboard
   - For webhooks: use [Stripe CLI](https://stripe.com/docs/stripe-cli) locally

#### 7. **Cloudflare R2** (for resume storage)
   - Sign up at [Cloudflare](https://www.cloudflare.com/)
   - Create R2 bucket
   - Generate API token

---

## 📦 Available Scripts

### Development
```bash
pnpm dev              # Start all services
pnpm dev:web          # Start frontend only
pnpm dev:api          # Start backend only
```

### Build
```bash
pnpm build            # Build all apps
pnpm build:web        # Build frontend
pnpm build:api        # Build backend
```

### Database
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:e2e         # Run E2E tests
```

### Code Quality
```bash
pnpm lint             # Lint all code
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript check
```

---

## 🗄️ Database Schema

Key tables:
- **users** - User accounts and preferences
- **resumes** - Resume files and parsed data
- **jobs** - Job listings from various sources
- **saved_jobs** - User bookmarked jobs with match scores
- **applications** - Application tracking
- **email_drafts** - Generated email drafts
- **subscriptions** - User subscription data

Run `pnpm db:studio` to explore the database visually.

---

## 🎯 How It Works

### 1. **Nightly Job Search**
Every night at 1 AM, the automation engine:
- Searches configured job sources (Greenhouse, Lever, etc.)
- Collects job listings
- Removes duplicates using fingerprinting
- Stores new jobs in database

### 2. **AI Matching**
For each job:
- Compares job requirements with user resume
- Calculates match score (0-100)
- Identifies missing skills
- Suggests resume improvements

### 3. **Email Draft Generation**
For high-scoring jobs:
- AI generates personalized email
- Selects best resume from user's collection
- Creates Gmail draft with resume attachment
- Notifies user

### 4. **User Review & Send**
User can:
- Review generated drafts
- Edit if needed
- Send at optimal time (suggested by AI)
- Track application status

---

## 🔒 Security Best Practices

✅ All secrets stored in environment variables  
✅ API keys never committed to Git  
✅ Rate limiting on all endpoints  
✅ Input validation with Zod  
✅ SQL injection prevention via Prisma  
✅ XSS protection  
✅ CORS properly configured  
✅ Helmet.js security headers  
✅ JWT-based authentication  
✅ Encrypted sensitive data  

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Backend (Railway / Render)
```bash
# Example: Railway
railway login
railway init
railway up
```

### Database (Neon / Supabase)
- Use managed PostgreSQL service
- Copy connection string to `DATABASE_URL`
- Run migrations: `pnpm db:migrate`

### Redis (Upstash)
- Create Upstash Redis database
- Copy connection string to `REDIS_URL`

---

## 📊 Subscription Plans

### Free Tier
- 20 job searches per day
- 5 email drafts per day
- 1 resume
- Basic matching

### Pro Tier ($19/month)
- Unlimited searches
- Unlimited drafts
- 5 resumes
- Advanced AI matching
- Priority support

### Premium Tier ($49/month)
- Everything in Pro
- AI resume optimization
- Company insights
- Interview preparation
- Referral finder

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🐛 Known Issues

- LinkedIn direct scraping not supported (use company careers instead)
- Gmail API requires OAuth consent screen approval
- Rate limits apply to free tier AI APIs

---

## 🗺️ Roadmap

- [ ] v1.0 - MVP with core features
- [ ] v1.1 - Chrome extension
- [ ] v1.2 - Mobile app
- [ ] v2.0 - Interview preparation AI
- [ ] v2.1 - Salary negotiation assistant
- [ ] v3.0 - Team accounts

---

## 📧 Support

- **Email**: support@applypilot.com
- **Discord**: [Join our community](#)
- **Issues**: [GitHub Issues](#)

---

## ⭐ Star History

If this project helps you, please consider giving it a star!

---

**Made with ❤️ by developers, for developers**
