# Plataforma de Certificação / Certification Platform

A professional online certification platform for medical education courses. Students complete modules with video and text content, take quizzes, pass a final exam, and receive an automatically generated certificate.

## Features

- **Secure Authentication** — Email-based login with invitation flow for enrolled students
- **Modular Content** — Courses organized into sequential modules with video and text
- **Quizzes & Exams** — Per-module quizzes and a final exam with configurable pass threshold
- **Automatic Certificates** — PDF certificates with unique verification codes and QR codes
- **Admin Panel** — Full content management, student management, and analytics dashboard
- **Multilingual** — European Portuguese (default) and English
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage) |
| Internationalization | next-intl |
| Certificate Generation | HTML/CSS + QR Code |
| Email | Resend |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- **Node.js** 18+ — [Download here](https://nodejs.org/)
- **Supabase account** — [Sign up free](https://supabase.com/)
- **Git** — [Download here](https://git-scm.com/)

### 1. Install Node.js

Download and install Node.js LTS from https://nodejs.org/. This also installs npm (the package manager).

### 2. Clone and install dependencies

```bash
git clone <your-repo-url>
cd certification-platform
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com/) and create a new project
2. In the Supabase dashboard, go to **SQL Editor**
3. Copy the contents of `supabase/migrations/00001_initial_schema.sql` and run it
4. Go to **Settings → API** and copy your project URL and keys

### 4. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=pt
```

### 5. Seed demo data

```bash
npm run db:seed
```

This creates:
- A demo course with 3 modules and questions
- Admin account: `admin@certificacao.local` / `admin123456`
- Student account: `aluno@certificacao.local` / `aluno123456`

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/          # Login, reset password, accept invitation
│   │   ├── (student)/       # Student dashboard, courses, modules, certificates
│   │   └── (admin)/         # Admin panel
│   └── api/                 # API routes (auth, certificates, admin)
├── components/
│   ├── ui/                  # Reusable UI components (Button, Card, etc.)
│   ├── layout/              # Header, Footer
│   ├── course/              # Course-specific components
│   ├── quiz/                # Quiz components
│   ├── admin/               # Admin-specific components
│   └── certificate/         # Certificate components
├── lib/
│   ├── supabase/            # Supabase client configuration
│   ├── i18n/                # Internationalization setup
│   ├── utils/               # Utility functions
│   └── certificates/        # Certificate generation
├── messages/                # Translation files (pt.json, en.json)
├── hooks/                   # Custom React hooks
└── types/                   # TypeScript type definitions

supabase/
└── migrations/              # Database migrations

scripts/
└── seed.ts                  # Database seed script

docs/
└── PRD.md                   # Product Requirements Document
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:migrate` | Push database migrations |

## User Roles

### Student
- View enrolled courses and track progress
- Watch videos and read module content
- Take module quizzes (retakable, best score counts)
- Take the final exam (80% pass threshold, configurable)
- Download certificates upon passing

### Admin
- Manage courses, modules, and content
- Add/edit quiz and exam questions
- Invite students by email
- View student progress and analytics
- Configure platform settings

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com/) and import your repository
3. Add your environment variables in the Vercel dashboard
4. Deploy — Vercel handles everything automatically

### Custom Domain

After deploying to Vercel, you can add a custom domain in the Vercel dashboard under **Settings → Domains**.

## Security

- All passwords are hashed by Supabase Auth (bcrypt)
- Row Level Security (RLS) on all database tables
- JWT-based session management
- HTTPS enforced in production
- Input validation with Zod schemas
- CSRF protection via Supabase Auth

## License

Private — All rights reserved.
