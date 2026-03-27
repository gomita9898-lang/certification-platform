# Certification Platform

## Project Overview
Online certification platform for medical/oncology education. Students complete modules (video + text), take quizzes, pass a final exam (80% configurable threshold), and receive automatic certificates with unique IDs.

## Tech Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **i18n:** next-intl (PT default, EN secondary)
- **Deployment:** Vercel

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
npm run db:seed      # Seed demo data
```

## Architecture Notes
- App Router with `[locale]` segment for i18n
- Route groups: `(auth)` for login pages, `(student)` for student UI, `(admin)` for admin panel
- Supabase Row Level Security on all tables
- Sequential module progression — students can revisit completed modules
- Certificate codes: XXXX-XXXX-XXXX-XXXX format (Salesforce-style)
- All user-facing text in translation files (`src/messages/`)

## Database
Migration in `supabase/migrations/00001_initial_schema.sql`
- All content tables have `_pt` and `_en` columns for bilingual support
- Use `getLocalizedField()` utility to resolve the right language

## Conventions
- European Portuguese (not Brazilian) for PT content
- Use `useTranslations()` in client components, `getTranslations()` in server components
- UI components in `src/components/ui/` follow shadcn/ui patterns
- Prefer server components; use "use client" only when needed
