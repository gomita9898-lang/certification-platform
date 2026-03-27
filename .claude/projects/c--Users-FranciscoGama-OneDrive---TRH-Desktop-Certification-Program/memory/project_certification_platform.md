---
name: Certification Platform — Project Overview
description: Online medical education certification platform with modules, quizzes, video content, and automatic certificate generation
type: project
---

Online certification platform for medical/oncology students.

**Core features:** secure login, modular content (video + text), per-module quizzes, final exam, automatic certificate generation, admin panel with analytics, progress tracking.

**Why:** University course requirement — students complete modules, pass assessments, receive certification automatically.

**How to apply:**
- MVP-first approach — foundation and architecture before content
- European Portuguese as default language, English secondary
- One course initially, architecture supports multiple courses
- No payments, no manual certificate approval
- Students get credentials generated from their email addresses
- Harvard-style academic UI inspiration
- Managed cloud services preferred for MVP

**Confirmed decisions (2026-03-27):**
- Passing threshold: 80% (must be configurable by admin)
- Scale: 0–15 students initially — very small cohort
- Videos: YouTube unlisted (embedded) — recommended over self-hosting for small scale
- Certificate: unique certification ID (Salesforce-style), template with institutional logo to be designed later
- Deployment: cloud URL for MVP, custom domain later
- Modules: sequential order required; completed modules remain accessible for review
- Quizzes: retakable, best score counts (assumed)
- Question types: multiple choice for MVP (assumed)
- Version control: GitHub (confirmed by assumption acceptance)
