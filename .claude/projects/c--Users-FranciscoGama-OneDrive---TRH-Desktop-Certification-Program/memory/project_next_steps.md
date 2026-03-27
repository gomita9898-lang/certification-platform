---
name: Next Steps — Remaining Tasks
description: Pending tasks and testing status as of 2026-03-27
type: project
---

**Awaiting testing (2026-03-28):**
- Student invite flow: franciscogama98@gmail.com cleaned, admin password reset to admin123456
- Email rate limit hit on Supabase — retry invite tomorrow
- Test in incognito window to avoid admin session conflict

**Completed (2026-03-27):**
- Platform deployed at https://certification-platform-ten.vercel.app
- Admin redirect to /admin/dashboard on login
- Students page, reports, and dashboard showing data (RLS fix)
- Rich text editor for module content
- Question save via API routes
- Certificate with UBI branding + QR verification page
- Student onboarding: invite → email → setup password → login
- Delete student functionality
- Password strength indicator + show/hide toggle

**Still to do:**
1. Customize certificate template — finalize with Francisco's input
2. Bulk admin actions — reset/unenroll multiple students
3. Add real course content — videos, module text, questions
4. Custom domain (later)

**Future improvements (confirmed but not urgent):**
- Access expiration dates for students
- Question bank with random selection
