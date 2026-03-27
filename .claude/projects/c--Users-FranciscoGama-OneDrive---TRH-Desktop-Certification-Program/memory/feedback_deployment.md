---
name: Deployment workflow preference
description: Batch changes before pushing to GitHub/Vercel — don't deploy after every small fix
type: feedback
---

Batch changes before pushing to GitHub (which triggers Vercel auto-deploy). Don't push after every small fix.

**Why:** Reduce unnecessary Vercel deployments and keep deploy history clean.
**How to apply:** Make all changes locally, verify with `npm run build`, then push once when a batch of features is complete. No need to ask for approval before pushing — just don't push trivially.
