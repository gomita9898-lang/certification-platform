---
name: Admin Panel Improvements — Confirmed Requirements
description: Confirmed admin features to build — reset progress, preview workflow, bulk actions, reports, question import
type: project
---

Confirmed admin improvements (2026-03-27):

1. **Reset student progress** — All options: reset everything, reset specific modules, reset exam only, or reset individual items. Each as separate actions.
2. **Bulk actions** — Reset progress for multiple students at once, unenroll students in bulk.
3. **Student communication** — Creation/invitation email only (sent when admin invites a student). No other automated emails for now.
4. **Content preview workflow** — Admin edits content, previews it in a "student view" before activating. Overwriting is fine (no versioning), but changes must be previewed and accepted before going live.
5. **Reports & exports** — Visualize reports in-platform (grades, completion, certificates) with Excel export option.
6. **Question management** — Bulk import questions from spreadsheet + add individual questions directly on the platform per module. No random question pool for now.
7. **Access expiration** — Not needed now, but architecture should support it later.

**Why:** Francisco needs full control over the platform as a non-technical admin.
**How to apply:** Build these features into the admin panel. Preview workflow is highest priority since it affects content editing flow.
