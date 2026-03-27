---
name: Test before deploying
description: Run integration/functional tests locally before pushing to Vercel to avoid deploying bugs
type: feedback
---

Run tests and verify functionality locally before pushing changes to GitHub/Vercel.

**Why:** Multiple deployments with bugs frustrate the user. Francisco is non-technical and can't debug — every broken deploy wastes his time.
**How to apply:** Before every `git push`, at minimum: build successfully, test key API routes with curl, verify page renders. Write automated tests where practical.
