# Product Requirements Document (PRD)

## Online Certification Platform for Medical/Oncology Education

**Version:** 1.0
**Date:** 2026-03-27
**Author:** Development Team
**Status:** Draft

---

## Table of Contents

1. [Product Requirements Document](#1-product-requirements-document)
2. [Feature List (MVP vs Future)](#2-feature-list-mvp-vs-future)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [User Journeys](#4-user-journeys)
5. [Information Architecture / Sitemap](#5-information-architecture--sitemap)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [Security and Privacy](#8-security-and-privacy)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment and Maintenance](#10-deployment-and-maintenance)
11. [Team Structure](#11-team-structure)

---

## 1. Product Requirements Document

### 1.1 Executive Summary

This platform is a web-based certification program designed for a university lecturer in Medicine/Oncology. It enables the delivery of structured, sequential online courses to small cohorts of students (0-15 per cohort). Students progress through video-based modules, complete quizzes, pass a final exam, and receive verifiable PDF certificates upon successful completion.

The platform is built with a Harvard-inspired clean academic UI, defaults to European Portuguese with English as a secondary language, and is designed to be managed entirely by a non-technical administrator.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| **Deliver structured education** | Provide sequential, module-based oncology courses with video content, rich text, and assessments. |
| **Ensure knowledge retention** | Validate student learning through per-module quizzes and a comprehensive final exam with an 80% passing threshold. |
| **Issue verifiable credentials** | Generate PDF certificates with unique IDs, QR codes, and public verification URLs. |
| **Simplify administration** | Give the lecturer a straightforward admin panel to manage courses, students, content, and view analytics without technical expertise. |
| **Support bilingual delivery** | Serve content in European Portuguese (default) and English. |
| **Scale appropriately** | Support small cohorts (0-15 students) with the architecture capable of scaling to multiple courses in the future. |

### 1.3 Target Users

**Primary Users:**

- **Admin (Lecturer/Course Owner):** A university professor in Medicine/Oncology who is non-technical. Needs an intuitive interface to create courses, manage students, author content, define quiz questions, and review analytics.
- **Students (Medical/Oncology Professionals or Trainees):** 0-15 per cohort. They enroll by invitation, consume course material, take quizzes, complete the final exam, and download certificates.

**Secondary Users:**

- **Certificate Verifiers:** Employers, institutions, or regulatory bodies who verify certificate authenticity via the public verification URL or QR code.

### 1.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Course completion rate | > 70% of enrolled students | Admin analytics dashboard |
| Average quiz score | > 80% across all modules | Quiz attempt data |
| Final exam pass rate | > 75% on first or subsequent attempts | Exam attempt data |
| Certificate issuance | 100% of students who pass receive a certificate | Certificate records |
| Admin task completion time | < 5 minutes for common tasks (add student, create question) | Usability observation |
| Platform uptime | > 99.5% | Vercel/Supabase monitoring |
| Page load time | < 2 seconds on 4G connection | Lighthouse/Web Vitals |

---

## 2. Feature List (MVP vs Future)

### 2.1 MVP Features

#### Authentication & Authorization
- Login with email and password
- Student invitation by email (admin sends invite, student sets password)
- Password reset via email
- Role-based access (Admin, Student)
- Session management with JWT tokens (Supabase Auth)

#### Course Management
- Course listing page (student view)
- Course detail page with module overview
- Single course support (multi-course is future)

#### Module System
- Module pages with embedded YouTube video (unlisted)
- Rich text content per module (formatted descriptions, instructions, key points)
- Sequential module progression (must complete previous module to unlock next)
- Module completion tracking

#### Quizzes
- Per-module quizzes with multiple choice questions
- Retakable quizzes (unlimited attempts)
- Best score is recorded
- Immediate feedback after submission (correct/incorrect per question)
- Minimum question count configurable per quiz

#### Final Exam
- Comprehensive exam covering all modules
- Multiple choice questions
- 80% passing threshold (configurable via app settings)
- Retakable (unlimited attempts, best score recorded)
- Only accessible after all modules are completed

#### Progress Tracking
- Visual progress indicator per course (percentage complete)
- Module completion status (locked, in progress, completed)
- Quiz scores per module
- Exam attempt history

#### Certificate Generation
- Automatic PDF certificate generation upon passing the final exam
- Unique certificate ID (Salesforce-style format, e.g., `CERT-2026-00001`)
- QR code linking to verification URL
- Public verification page (no login required)
- Certificate download (PDF)
- Certificate details: student name, course name, completion date, score, unique ID

#### Admin Panel
- Dashboard with key metrics overview
- Manage courses (create, edit, publish/unpublish)
- Manage modules (create, edit, reorder, delete)
- Manage module content (rich text editor, YouTube URL input)
- Manage quiz questions and options (create, edit, delete, mark correct answer)
- Manage students (invite, view progress, remove enrollment)
- View analytics (enrollment counts, completion rates, quiz score distributions, certificate statistics)

#### Internationalization
- European Portuguese (pt-PT) as default language
- English (en) as secondary language
- Language switcher in the UI
- All static UI text translated
- Content (courses, modules, questions) is authored in a single language by the admin

#### Responsive Design
- Mobile-first responsive layout
- Functional on phones, tablets, and desktops
- Video player adapts to screen size

### 2.2 Future Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Multiple courses | High | Support multiple independent courses with separate enrollments. |
| Custom certificate templates | High | Admin-designed certificate layouts with logo, colors, and fields. |
| Additional question types | Medium | Drag-and-drop, fill-in-the-blank, matching, true/false, short answer. |
| Discussion forums | Medium | Per-module discussion threads for student interaction. |
| Student notes | Medium | Personal note-taking within modules, exportable. |
| SCORM/xAPI integration | Low | Integration with LMS standards for interoperability. |
| Payment integration | Medium | Stripe/payment gateway for paid courses. |
| Custom domains | Low | Allow white-label deployments with custom domains. |
| Advanced analytics/exports | Medium | CSV/Excel export of all analytics data, custom date ranges, cohort comparison. |
| Gamification | Low | Badges for milestones, leaderboards, streak tracking. |
| Accessibility (WCAG 2.1 AA) | High | Full accessibility compliance including screen reader support, keyboard navigation, contrast ratios. |
| Instructor role | Medium | Separate role for content creators who are not full admins. |
| Read-only admin | Low | Admin role with view-only access to analytics and student data. |
| Email notifications | Medium | Automated emails for quiz results, course completion, reminders. |
| Content versioning | Low | Track changes to course content over time. |

---

## 3. User Roles and Permissions

### 3.1 Role Matrix (MVP)

| Permission | Admin | Student |
|------------|-------|---------|
| **Authentication** | | |
| Login / Logout | Yes | Yes |
| Reset own password | Yes | Yes |
| **Courses** | | |
| Create / Edit / Delete courses | Yes | No |
| View course listing | Yes | Yes (enrolled only) |
| View course detail | Yes | Yes (enrolled only) |
| Publish / Unpublish courses | Yes | No |
| **Modules** | | |
| Create / Edit / Delete modules | Yes | No |
| Reorder modules | Yes | No |
| View module content | Yes | Yes (sequential, enrolled only) |
| **Quizzes** | | |
| Create / Edit / Delete questions | Yes | No |
| Take quizzes | No | Yes |
| View all quiz results | Yes | Own only |
| **Final Exam** | | |
| Configure exam settings | Yes | No |
| Take final exam | No | Yes |
| View all exam results | Yes | Own only |
| **Students** | | |
| Invite students | Yes | No |
| Remove student enrollment | Yes | No |
| View student list | Yes | No |
| View own progress | Yes | Yes |
| View all students' progress | Yes | No |
| **Certificates** | | |
| View all issued certificates | Yes | Own only |
| Download certificate | Yes | Yes (own only) |
| Revoke certificate | Yes | No |
| **Settings** | | |
| Configure app settings | Yes | No |
| Change language | Yes | Yes |
| **Analytics** | | |
| View dashboard analytics | Yes | No |

### 3.2 Future Roles

- **Instructor:** Can create and manage course content, view enrolled students and their progress, but cannot manage other admins or system settings.
- **Read-only Admin:** Can view all analytics, student progress, and course content, but cannot modify anything.

---

## 4. User Journeys

### 4.1 Admin Invites a Student

```
1. Admin logs into the admin panel.
2. Admin navigates to Students > Invite Student.
3. Admin enters the student's email address and selects the course to enroll them in.
4. Admin clicks "Send Invitation."
5. System creates a user record (if not existing) and an enrollment record.
6. System sends an invitation email via Resend with a link to set their password.
7. Admin sees a confirmation message and the student appears in the student list
   with status "Invited."
```

### 4.2 Student First Login

```
1. Student receives the invitation email.
2. Student clicks the "Set Password" link in the email.
3. Student is directed to the password setup page.
4. Student enters and confirms a password.
5. System validates the password (minimum 8 characters, at least one number
   and one letter).
6. Student is logged in and redirected to the course dashboard.
7. The course dashboard shows the enrolled course with 0% progress.
8. The first module is unlocked; subsequent modules are locked.
```

### 4.3 Student Completes a Module

```
1. Student navigates to the course page and clicks on the first unlocked module.
2. The module page loads with the embedded YouTube video at the top and rich text
   content below.
3. Student watches the video and reads the content.
4. At the bottom of the module page, a "Take Quiz" button is available.
5. Student clicks "Take Quiz" and is presented with multiple choice questions.
6. Student answers all questions and clicks "Submit."
7. System scores the quiz and shows results (correct/incorrect per question,
   total score).
8. If the student is satisfied with their score, they click "Continue."
   If not, they can click "Retake Quiz."
9. Upon continuing, the module is marked as completed, and the next module
   is unlocked.
10. The progress bar on the course page updates.
```

### 4.4 Student Takes a Quiz

```
1. Student is on a module page and clicks "Take Quiz."
2. System loads the quiz questions for this module in a randomized order.
3. Each question displays:
   - Question text
   - 3-5 answer options as radio buttons
4. Student selects an answer for each question.
5. Student can navigate between questions before submitting.
6. Student clicks "Submit Quiz."
7. System records the attempt with timestamp and calculates the score.
8. Results page shows:
   - Overall score (percentage)
   - Per-question feedback (correct answer highlighted, student's answer shown)
   - "Best Score" indicator if this attempt is the new best
9. Student can choose "Retake Quiz" or "Back to Module."
10. The best score across all attempts is the one that counts.
```

### 4.5 Student Takes the Final Exam

```
1. Student completes all modules (all module quizzes taken, all modules marked
   as completed).
2. The "Final Exam" section on the course page becomes unlocked.
3. Student clicks "Start Final Exam."
4. A confirmation dialog appears: "The final exam covers all modules. You need
   80% to pass. You can retake the exam if needed. Begin?"
5. Student confirms and the exam loads.
6. Questions are presented (drawn from all modules or a dedicated exam question
   pool, as configured by admin).
7. Student answers all questions and clicks "Submit Exam."
8. System scores the exam.
9. Results page shows:
   - Overall score (percentage)
   - Pass/Fail status
   - Per-question feedback
   - If passed: "Congratulations! Your certificate is being generated."
   - If failed: "You did not reach the 80% threshold. You can retake the exam."
10. If the student passes, the system triggers certificate generation.
```

### 4.6 Student Receives Certificate

```
1. Upon passing the final exam, the system automatically generates a PDF
   certificate.
2. Certificate includes:
   - Student full name
   - Course title
   - Completion date
   - Final exam score
   - Unique certificate ID (e.g., CERT-2026-00001)
   - QR code linking to the verification URL
   - Platform branding
3. The certificate is stored in Supabase Storage.
4. Student is redirected to the certificate page showing:
   - Certificate preview
   - "Download PDF" button
   - Verification URL (copyable)
   - QR code
5. The certificate is also accessible from the student's dashboard under
   "My Certificates."
6. Anyone with the verification URL or QR code can visit the public verification
   page, which shows:
   - Certificate ID
   - Student name
   - Course name
   - Issue date
   - Validity status (valid/revoked)
```

### 4.7 Admin Manages Content

```
1. Admin logs into the admin panel.
2. Admin navigates to Courses and selects the course to edit.
3. Admin can:
   a. Edit course details (title, description, thumbnail).
   b. Navigate to Modules to add, edit, reorder, or delete modules.
4. When editing a module, admin can:
   a. Set the module title and description.
   b. Paste a YouTube URL for the video embed.
   c. Use a rich text editor to write module content (supports headings,
      bold, italic, lists, links, images).
   d. Navigate to the module's quiz to add, edit, or delete questions.
5. When managing questions, admin can:
   a. Write the question text.
   b. Add 3-5 answer options.
   c. Mark the correct answer.
   d. Reorder questions.
6. Admin clicks "Save" after each change.
7. Changes are immediately reflected for students (no separate publish step
   for content within a published course).
```

### 4.8 Admin Views Analytics

```
1. Admin logs into the admin panel.
2. Admin navigates to Analytics (dashboard).
3. The dashboard displays:
   a. Total enrolled students (with trend).
   b. Overall course completion rate (percentage and chart).
   c. Average quiz scores per module (bar chart).
   d. Final exam pass rate (percentage and chart).
   e. Total certificates issued.
   f. Recent activity feed (latest enrollments, completions, exam attempts).
4. Admin can click into specific sections:
   a. "Students" to see per-student progress and scores.
   b. "Modules" to see completion rates and quiz performance per module.
   c. "Exams" to see attempt history and score distribution.
   d. "Certificates" to see all issued certificates with download links.
5. Data is displayed in real-time from the database.
```

---

## 5. Information Architecture / Sitemap

### 5.1 Public Pages (No Authentication Required)

```
/
├── / ................................. Landing page / Login
├── /login ........................... Login form
├── /reset-password .................. Password reset request
├── /set-password?token=xxx .......... Set password (from invitation or reset)
└── /verify/[certificateId] .......... Public certificate verification page
```

### 5.2 Student Pages (Authenticated)

```
/dashboard
├── /dashboard ....................... Student dashboard (enrolled courses, progress)
├── /courses
│   └── /courses/[courseId] .......... Course detail (module list, progress bar)
│       ├── /courses/[courseId]/modules/[moduleId] ........ Module page (video + content)
│       ├── /courses/[courseId]/modules/[moduleId]/quiz ... Module quiz
│       ├── /courses/[courseId]/modules/[moduleId]/quiz/results/[attemptId] .. Quiz results
│       ├── /courses/[courseId]/exam ...................... Final exam
│       └── /courses/[courseId]/exam/results/[attemptId] . Exam results
├── /certificates .................... List of earned certificates
│   └── /certificates/[certificateId] Certificate detail + download
├── /profile ......................... Student profile (name, email, language)
└── /settings ........................ Student settings (language, password change)
```

### 5.3 Admin Pages (Authenticated, Admin Role)

```
/admin
├── /admin ........................... Admin dashboard (analytics overview)
├── /admin/courses
│   ├── /admin/courses ............... Course list
│   ├── /admin/courses/new ........... Create course
│   └── /admin/courses/[courseId]
│       ├── /admin/courses/[courseId]/edit ............... Edit course details
│       ├── /admin/courses/[courseId]/modules
│       │   ├── /admin/courses/[courseId]/modules/new .... Create module
│       │   └── /admin/courses/[courseId]/modules/[moduleId]
│       │       ├── /admin/courses/[courseId]/modules/[moduleId]/edit .... Edit module
│       │       └── /admin/courses/[courseId]/modules/[moduleId]/questions
│       │           ├── .../questions ................... Question list
│       │           ├── .../questions/new ............... Create question
│       │           └── .../questions/[questionId]/edit . Edit question
│       └── /admin/courses/[courseId]/exam
│           └── /admin/courses/[courseId]/exam/questions
│               ├── .../questions ...................... Exam question list
│               ├── .../questions/new .................. Create exam question
│               └── .../questions/[questionId]/edit .... Edit exam question
├── /admin/students
│   ├── /admin/students .............. Student list
│   ├── /admin/students/invite ....... Invite student
│   └── /admin/students/[userId] ..... Student detail (progress, scores)
├── /admin/certificates .............. All issued certificates
├── /admin/analytics
│   ├── /admin/analytics ............. Analytics dashboard
│   ├── /admin/analytics/enrollments . Enrollment analytics
│   ├── /admin/analytics/quizzes ..... Quiz performance analytics
│   ├── /admin/analytics/exams ....... Exam performance analytics
│   └── /admin/analytics/certificates  Certificate analytics
└── /admin/settings .................. App settings (pass threshold, etc.)
```

---

## 6. Database Schema

All tables use UUIDs as primary keys. Timestamps use `TIMESTAMPTZ`. The schema leverages Supabase's `auth.users` table for authentication and extends it with a `public.users` profile table.

### 6.1 Users

```sql
-- Extends Supabase auth.users with application-specific profile data
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  locale        TEXT NOT NULL DEFAULT 'pt-PT' CHECK (locale IN ('pt-PT', 'en')),
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  invited_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.2 Courses

```sql
CREATE TABLE public.courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.3 Modules

```sql
CREATE TABLE public.modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (course_id, sort_order)
);

CREATE INDEX idx_modules_course_id ON public.modules(course_id);
```

### 6.4 Module Content

```sql
CREATE TABLE public.module_content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  video_url     TEXT,                          -- YouTube unlisted URL
  content_html  TEXT,                          -- Rich text content (HTML)
  content_json  JSONB,                         -- Rich text content (editor JSON, e.g., TipTap)
  sort_order    INTEGER NOT NULL DEFAULT 0,    -- For multiple content blocks per module
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_module_content_module_id ON public.module_content(module_id);
```

### 6.5 Questions

```sql
CREATE TABLE public.questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id     UUID REFERENCES public.modules(id) ON DELETE CASCADE,  -- NULL for final exam questions
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice'
                CHECK (question_type IN ('multiple_choice')),          -- Extensible for future types
  is_exam       BOOLEAN NOT NULL DEFAULT false,                        -- true = final exam question
  sort_order    INTEGER NOT NULL DEFAULT 0,
  points        INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Module questions must have a module_id; exam questions must not
  CONSTRAINT chk_question_scope CHECK (
    (is_exam = false AND module_id IS NOT NULL) OR
    (is_exam = true AND module_id IS NULL)
  )
);

CREATE INDEX idx_questions_module_id ON public.questions(module_id);
CREATE INDEX idx_questions_course_id ON public.questions(course_id);
```

### 6.6 Question Options

```sql
CREATE TABLE public.question_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text   TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);
```

### 6.7 Quiz Attempts

```sql
CREATE TABLE public.quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  score         DECIMAL(5,2) NOT NULL,          -- Percentage score (0.00 - 100.00)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_module_id ON public.quiz_attempts(module_id);
CREATE INDEX idx_quiz_attempts_student_module ON public.quiz_attempts(student_id, module_id);
```

### 6.8 Quiz Answers

```sql
CREATE TABLE public.quiz_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
  is_correct      BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
```

### 6.9 Exam Attempts

```sql
CREATE TABLE public.exam_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score         DECIMAL(5,2) NOT NULL,          -- Percentage score (0.00 - 100.00)
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_course_id ON public.exam_attempts(course_id);
CREATE INDEX idx_exam_attempts_student_course ON public.exam_attempts(student_id, course_id);
```

### 6.10 Exam Answers

```sql
CREATE TABLE public.exam_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
  is_correct      BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_answers_attempt_id ON public.exam_answers(attempt_id);
```

### 6.11 Student Progress

```sql
CREATE TABLE public.student_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'locked'
                CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  best_quiz_score DECIMAL(5,2),                -- Best quiz score for this module
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (student_id, module_id)
);

CREATE INDEX idx_student_progress_student_id ON public.student_progress(student_id);
CREATE INDEX idx_student_progress_module_id ON public.student_progress(module_id);
CREATE INDEX idx_student_progress_course_id ON public.student_progress(course_id);
```

### 6.12 Certificates

```sql
CREATE TABLE public.certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id  TEXT NOT NULL UNIQUE,          -- Human-readable ID (e.g., CERT-2026-00001)
  student_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id),
  student_name    TEXT NOT NULL,                  -- Snapshot at time of issuance
  course_title    TEXT NOT NULL,                  -- Snapshot at time of issuance
  score           DECIMAL(5,2) NOT NULL,
  pdf_url         TEXT,                           -- Supabase Storage URL
  verification_url TEXT NOT NULL,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  is_valid        BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (student_id, course_id)
);

CREATE INDEX idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX idx_certificates_certificate_id ON public.certificates(certificate_id);
```

### 6.13 Student Enrollments

```sql
CREATE TABLE public.student_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'invited'
                CHECK (status IN ('invited', 'active', 'completed', 'removed')),
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (student_id, course_id)
);

CREATE INDEX idx_student_enrollments_student_id ON public.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_course_id ON public.student_enrollments(course_id);
```

### 6.14 App Settings

```sql
CREATE TABLE public.app_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL UNIQUE,
  value         TEXT NOT NULL,
  description   TEXT,
  updated_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('pass_threshold', '80', 'Minimum percentage to pass the final exam'),
  ('certificate_prefix', 'CERT', 'Prefix for certificate IDs'),
  ('default_locale', 'pt-PT', 'Default language for new users'),
  ('max_quiz_attempts', '0', 'Maximum quiz attempts per module (0 = unlimited)'),
  ('max_exam_attempts', '0', 'Maximum exam attempts (0 = unlimited)');
```

### 6.15 Utility: Updated_at Trigger

```sql
-- Automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.module_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6.16 Entity Relationship Summary

```
auth.users (Supabase)
  └── 1:1 ── users (profile)
                ├── 1:N ── student_enrollments
                ├── 1:N ── student_progress
                ├── 1:N ── quiz_attempts
                ├── 1:N ── exam_attempts
                └── 1:N ── certificates

courses
  ├── 1:N ── modules
  │            ├── 1:N ── module_content
  │            ├── 1:N ── questions (is_exam = false)
  │            ├── 1:N ── student_progress
  │            └── 1:N ── quiz_attempts
  ├── 1:N ── questions (is_exam = true)
  ├── 1:N ── student_enrollments
  ├── 1:N ── exam_attempts
  └── 1:N ── certificates

questions
  └── 1:N ── question_options

quiz_attempts
  └── 1:N ── quiz_answers

exam_attempts
  └── 1:N ── exam_answers
```

---

## 7. API Design

All API routes are implemented as Next.js 15 Route Handlers under `/app/api/`. Authentication is handled via Supabase Auth (JWT in cookies). Admin-only endpoints check the user's role.

### 7.1 Authentication Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/login` | Login with email and password | Public |
| POST | `/api/auth/logout` | Logout and clear session | Authenticated |
| POST | `/api/auth/reset-password` | Request password reset email | Public |
| POST | `/api/auth/set-password` | Set password (from invite or reset) | Public (with token) |
| GET | `/api/auth/me` | Get current user profile | Authenticated |
| PATCH | `/api/auth/me` | Update current user profile | Authenticated |

### 7.2 Course Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/courses` | List courses (students see enrolled; admin sees all) | Authenticated |
| GET | `/api/courses/[courseId]` | Get course detail with module list | Authenticated |
| POST | `/api/courses` | Create a new course | Admin |
| PATCH | `/api/courses/[courseId]` | Update course details | Admin |
| DELETE | `/api/courses/[courseId]` | Delete a course | Admin |
| PATCH | `/api/courses/[courseId]/publish` | Publish or unpublish a course | Admin |

### 7.3 Module Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/courses/[courseId]/modules` | List modules for a course | Authenticated |
| GET | `/api/courses/[courseId]/modules/[moduleId]` | Get module detail with content | Authenticated |
| POST | `/api/courses/[courseId]/modules` | Create a new module | Admin |
| PATCH | `/api/courses/[courseId]/modules/[moduleId]` | Update module details | Admin |
| DELETE | `/api/courses/[courseId]/modules/[moduleId]` | Delete a module | Admin |
| PATCH | `/api/courses/[courseId]/modules/reorder` | Reorder modules | Admin |

### 7.4 Module Content Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/modules/[moduleId]/content` | Get content blocks for a module | Authenticated |
| POST | `/api/modules/[moduleId]/content` | Add content block | Admin |
| PATCH | `/api/modules/[moduleId]/content/[contentId]` | Update content block | Admin |
| DELETE | `/api/modules/[moduleId]/content/[contentId]` | Delete content block | Admin |

### 7.5 Question Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/modules/[moduleId]/questions` | List questions for a module quiz | Admin |
| POST | `/api/modules/[moduleId]/questions` | Create a quiz question | Admin |
| PATCH | `/api/questions/[questionId]` | Update a question | Admin |
| DELETE | `/api/questions/[questionId]` | Delete a question | Admin |
| GET | `/api/courses/[courseId]/exam/questions` | List exam questions | Admin |
| POST | `/api/courses/[courseId]/exam/questions` | Create an exam question | Admin |

### 7.6 Quiz Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/modules/[moduleId]/quiz` | Get quiz for a module (questions + options, no correct answer) | Student |
| POST | `/api/modules/[moduleId]/quiz/submit` | Submit quiz answers | Student |
| GET | `/api/modules/[moduleId]/quiz/attempts` | Get student's quiz attempts for a module | Student |
| GET | `/api/quiz-attempts/[attemptId]` | Get detailed results for a quiz attempt | Student (own) |

### 7.7 Exam Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/courses/[courseId]/exam` | Get final exam (questions + options, no correct answer) | Student |
| POST | `/api/courses/[courseId]/exam/submit` | Submit exam answers | Student |
| GET | `/api/courses/[courseId]/exam/attempts` | Get student's exam attempts | Student |
| GET | `/api/exam-attempts/[attemptId]` | Get detailed results for an exam attempt | Student (own) |

### 7.8 Progress Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/courses/[courseId]/progress` | Get student's progress for a course | Student |
| GET | `/api/admin/students/[userId]/progress` | Get a specific student's progress | Admin |
| PATCH | `/api/courses/[courseId]/modules/[moduleId]/progress` | Mark module as in-progress or completed | Student |

### 7.9 Certificate Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/certificates` | List student's own certificates | Student |
| GET | `/api/certificates/[certificateId]` | Get certificate detail | Student (own) |
| GET | `/api/certificates/[certificateId]/download` | Download certificate PDF | Student (own) |
| GET | `/api/verify/[certificateId]` | Public certificate verification | Public |

### 7.10 Admin Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/admin/students` | List all students with enrollment info | Admin |
| POST | `/api/admin/students/invite` | Invite a student by email | Admin |
| GET | `/api/admin/students/[userId]` | Get student detail with progress | Admin |
| DELETE | `/api/admin/students/[userId]/enrollments/[enrollmentId]` | Remove student enrollment | Admin |
| GET | `/api/admin/certificates` | List all issued certificates | Admin |
| PATCH | `/api/admin/certificates/[certificateId]/revoke` | Revoke a certificate | Admin |
| GET | `/api/admin/analytics/overview` | Dashboard analytics summary | Admin |
| GET | `/api/admin/analytics/enrollments` | Enrollment analytics | Admin |
| GET | `/api/admin/analytics/quizzes` | Quiz performance analytics | Admin |
| GET | `/api/admin/analytics/exams` | Exam performance analytics | Admin |
| GET | `/api/admin/analytics/certificates` | Certificate analytics | Admin |

### 7.11 Settings Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/admin/settings` | Get all app settings | Admin |
| PATCH | `/api/admin/settings/[key]` | Update a setting | Admin |

### 7.12 API Response Format

All API responses follow a consistent JSON structure:

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 42
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The score must be between 0 and 100.",
    "details": [ ... ]
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No content (successful delete)
- `400` - Bad request / Validation error
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for this action)
- `404` - Not found
- `409` - Conflict (e.g., duplicate enrollment)
- `429` - Rate limited
- `500` - Internal server error

---

## 8. Security and Privacy

### 8.1 Authentication Security

- **Password Hashing:** Supabase Auth uses bcrypt for password hashing. Passwords are never stored in plaintext.
- **JWT Tokens:** Supabase issues JWT tokens for session management. Tokens are stored in HTTP-only, Secure, SameSite cookies.
- **HTTPS:** All traffic is served over HTTPS (enforced by Vercel).
- **Password Requirements:** Minimum 8 characters, at least one letter and one number.
- **Session Expiry:** JWT tokens expire after 1 hour. Refresh tokens are used for seamless re-authentication and expire after 7 days of inactivity.

### 8.2 Row-Level Security (RLS)

Supabase RLS policies enforce data access at the database level:

```sql
-- Example: Students can only see their own progress
CREATE POLICY "Students can view own progress"
  ON public.student_progress
  FOR SELECT
  USING (auth.uid() = student_id);

-- Example: Students can only see courses they are enrolled in
CREATE POLICY "Students can view enrolled courses"
  ON public.courses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_enrollments
      WHERE student_enrollments.course_id = courses.id
      AND student_enrollments.student_id = auth.uid()
      AND student_enrollments.status IN ('active', 'completed')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Example: Only admins can insert/update/delete courses
CREATE POLICY "Admins can manage courses"
  ON public.courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### 8.3 Input Validation

- All API inputs are validated using **Zod** schemas on the server side.
- Client-side validation is used for UX but never trusted.
- SQL injection is prevented by Supabase's parameterized queries.
- HTML content from the rich text editor is sanitized server-side to prevent XSS (using a library such as DOMPurify on the server).

### 8.4 CSRF Protection

- Next.js 15 Route Handlers with cookie-based auth are protected by SameSite cookie attributes.
- State-changing operations (POST, PATCH, DELETE) verify the origin header.
- Supabase's built-in CSRF protections for auth endpoints are used.

### 8.5 Rate Limiting

- API routes are rate-limited using Vercel's Edge Middleware or an in-memory rate limiter (e.g., `@upstash/ratelimit` with Vercel KV).
- Limits:
  - Login attempts: 5 per minute per IP.
  - Password reset: 3 per hour per email.
  - Quiz/exam submissions: 10 per minute per user.
  - General API: 100 requests per minute per user.

### 8.6 Data Privacy

- **Nature of Data:** The platform stores educational data (names, emails, course progress, quiz scores, certificates). It does NOT store medical records, patient data, or any protected health information (PHI).
- **Data Minimization:** Only essential personal data is collected (name, email).
- **Data Retention:** User data is retained for the duration of the course plus 5 years for certificate verification purposes, after which it can be anonymized or deleted upon request.

### 8.7 GDPR Considerations

Given that students are EU-based, the following GDPR measures apply:

| Requirement | Implementation |
|-------------|----------------|
| **Lawful basis** | Legitimate interest (educational service delivery) and consent (at registration). |
| **Right to access** | Students can view all their data through their profile and progress pages. |
| **Right to erasure** | Admin can delete a student's account and associated data upon request. Certificates remain verifiable but are anonymized. |
| **Right to data portability** | Future: export student data in JSON/CSV format. |
| **Data processing agreement** | Supabase and Vercel act as data processors; ensure DPAs are signed. |
| **Privacy policy** | A privacy policy page must be available on the platform, detailing data collection, processing, and rights. |
| **Cookie consent** | Essential cookies only (auth session). No tracking cookies in MVP. No cookie banner required for essential-only cookies. |

### 8.8 Session Management

- Sessions are managed via Supabase Auth with JWT + refresh tokens.
- Server-side middleware validates the JWT on each request.
- Invalid or expired tokens redirect to the login page.
- Logout invalidates the session on the server side.
- Concurrent sessions are allowed (a user can be logged in on multiple devices).

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

**Scope:** Individual functions, utilities, hooks, and components in isolation.

**What to test:**
- Utility functions (score calculation, certificate ID generation, date formatting)
- Zod validation schemas (valid and invalid inputs)
- React hooks (custom hooks with mock data)
- Component rendering (renders correctly with given props)
- Score calculation logic (percentage, pass/fail determination)
- Data transformation functions (API response to UI model)

**Configuration:**
```
Framework: Vitest
Coverage target: > 80% for utility and logic files
Mocking: vi.mock for external dependencies (Supabase client, Resend)
```

**Example test areas:**
```
tests/unit/
├── utils/
│   ├── calculate-score.test.ts
│   ├── generate-certificate-id.test.ts
│   ├── format-date.test.ts
│   └── validate-password.test.ts
├── hooks/
│   ├── use-quiz.test.ts
│   └── use-progress.test.ts
└── components/
    ├── progress-bar.test.tsx
    ├── quiz-question.test.tsx
    └── module-card.test.tsx
```

### 9.2 Integration Tests

**Scope:** API routes, database interactions, and multi-component interactions.

**What to test:**
- API Route Handlers respond correctly (status codes, response format)
- Database queries return expected results (using a test database or Supabase local dev)
- Authentication flow (login, token validation, role checking)
- Quiz submission and scoring pipeline
- Certificate generation pipeline
- Student invitation flow (user creation + enrollment + email sending)
- RLS policies enforce correct access control

**Configuration:**
```
Framework: Vitest with Supabase local development (supabase start)
Database: Local Supabase instance with seed data
Mocking: Resend emails mocked, Supabase Storage mocked
```

### 9.3 End-to-End Tests (Playwright)

**Scope:** Full user journeys through the browser.

**What to test:**
- Student login and dashboard loading
- Module navigation (sequential unlocking)
- Quiz taking flow (answer questions, submit, view results)
- Quiz retake flow (take quiz again, verify best score updates)
- Final exam flow (prerequisites check, take exam, pass/fail)
- Certificate download and verification
- Admin: create course and modules
- Admin: add quiz questions
- Admin: invite student
- Admin: view analytics dashboard
- Language switching (PT-PT to EN and back)
- Responsive layout (mobile viewport)
- Password reset flow

**Configuration:**
```
Framework: Playwright
Browsers: Chromium, Firefox (WebKit optional)
Viewports: Desktop (1280x720), Mobile (375x667)
Base URL: Local dev server or preview deployment
```

### 9.4 Test Execution

| Type | Trigger | Environment |
|------|---------|-------------|
| Unit tests | Every commit (pre-commit hook), CI on PR | Local, GitHub Actions |
| Integration tests | CI on PR | GitHub Actions with Supabase CLI |
| E2E tests | CI on PR to main, pre-deployment | GitHub Actions with Playwright |

---

## 10. Deployment and Maintenance

### 10.1 Vercel Deployment

- **Hosting:** The Next.js 15 application is deployed on Vercel.
- **Build command:** `next build`
- **Output:** Automatic static optimization + serverless functions for API routes.
- **Preview deployments:** Every PR gets a preview deployment URL for review.
- **Production:** Merges to `main` branch trigger production deployments.

### 10.2 Supabase Managed Database

- **Database:** PostgreSQL managed by Supabase (cloud-hosted).
- **Auth:** Supabase Auth handles user authentication, password hashing, and token management.
- **Storage:** Supabase Storage is used for certificate PDFs and any uploaded assets.
- **Migrations:** Database schema changes are managed via Supabase CLI migrations (`supabase migration new`, `supabase db push`).
- **Local development:** Supabase CLI provides a local PostgreSQL instance for development.

### 10.3 Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Vercel + local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Vercel + local `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Vercel (secret) |
| `RESEND_API_KEY` | Resend email API key | Vercel (secret) |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Vercel |
| `NEXT_PUBLIC_VERIFICATION_URL` | Base URL for certificate verification | Vercel |

All secrets are stored in Vercel's environment variable management (encrypted at rest). The `.env.local` file is used locally and is in `.gitignore`.

### 10.4 CI/CD with GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [lint, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: npm run build
      - run: npm run test:e2e
```

### 10.5 Monitoring and Logging

| Area | Tool | Description |
|------|------|-------------|
| Application errors | Vercel Logs + Sentry (optional) | Runtime error tracking and alerting |
| Performance | Vercel Analytics + Web Vitals | Core Web Vitals (LCP, FID, CLS) |
| Database | Supabase Dashboard | Query performance, connection pool, storage usage |
| Uptime | Vercel (built-in) or UptimeRobot | Availability monitoring with alerts |
| Email delivery | Resend Dashboard | Email delivery success/failure rates |

### 10.6 Backup Strategy

| Data | Method | Frequency | Retention |
|------|--------|-----------|-----------|
| Database | Supabase automatic backups (Pro plan: daily point-in-time recovery) | Continuous | 7 days (Pro), 30 days (Team) |
| Certificate PDFs | Supabase Storage (redundant) | On generation | Indefinite |
| Application code | GitHub repository | On every commit | Indefinite |
| Environment config | Vercel environment variables | On change | Vercel manages |
| Database migrations | Git-tracked SQL files | On every schema change | Indefinite |

**Disaster Recovery:**
- Database can be restored to any point within the retention window via Supabase dashboard.
- Application can be redeployed from any Git commit via Vercel.
- Certificate PDFs are stored in Supabase Storage with redundancy.
- A manual database export (pg_dump) should be run monthly and stored externally as an additional safeguard.

---

## 11. Team Structure

### 11.1 Full Team (Real-World Version)

For a production-grade platform with ongoing development and support:

| Role | Count | Responsibilities |
|------|-------|------------------|
| **Product Owner** | 1 | Requirements, priorities, stakeholder communication |
| **Full-Stack Developer** | 1-2 | Next.js frontend + API, Supabase integration, deployment |
| **UI/UX Designer** | 1 (part-time) | Design system, wireframes, certificate template, accessibility |
| **QA Engineer** | 1 (part-time) | Test plan, E2E tests, manual testing, accessibility audit |
| **DevOps / SRE** | Shared | CI/CD pipeline, monitoring, Vercel/Supabase configuration |
| **Content Specialist** | 1 (client-side) | The lecturer who creates course content, quiz questions |

### 11.2 MVP: One Full-Stack Developer

For the MVP, a single full-stack developer can handle the entire project. Here is how the workload breaks down:

**What one developer handles:**

| Area | Scope |
|------|-------|
| **Project setup** | Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffolding, Supabase project, Vercel deployment |
| **Database** | Schema design, migrations, RLS policies, seed data |
| **Authentication** | Supabase Auth integration, login/logout/invite/reset flows |
| **Frontend** | All student and admin pages, responsive design, language switching |
| **API** | All Route Handlers, input validation, error handling |
| **Quizzes and Exams** | Question management, quiz taking, scoring, result display |
| **Certificates** | PDF generation (React-PDF), unique ID generation, QR code, verification page |
| **Admin panel** | Course/module/question CRUD, student management, analytics dashboard |
| **Internationalization** | next-intl setup, translation files for PT-PT and EN |
| **Testing** | Unit tests for critical logic, E2E tests for main flows |
| **Deployment** | Vercel deployment, GitHub Actions CI, environment configuration |

**What the developer should NOT do (delegate or defer):**

| Area | Recommendation |
|------|----------------|
| **Certificate visual design** | Defer to a designer or use a clean default template |
| **Course content creation** | The lecturer authors all content through the admin panel |
| **Legal/privacy review** | Consult a legal advisor for GDPR compliance and privacy policy text |
| **Accessibility audit** | Defer to future phase or hire an accessibility consultant |
| **Load testing** | Not needed for 0-15 user cohorts |

**Estimated MVP Timeline (One Developer):**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup and scaffolding | 1 week | Project structure, DB schema, auth flow, deployment pipeline |
| Core student experience | 2-3 weeks | Course/module pages, video embed, progress tracking, sequential unlock |
| Quizzes and final exam | 1-2 weeks | Quiz taking, scoring, retakes, exam flow, pass/fail logic |
| Certificate generation | 1 week | PDF generation, unique IDs, QR code, verification page |
| Admin panel | 2-3 weeks | Course/module/question CRUD, student management, analytics dashboard |
| Internationalization | 0.5-1 week | PT-PT and EN translations, language switcher |
| Testing and polish | 1-2 weeks | E2E tests, bug fixes, responsive design refinements, UX improvements |
| **Total** | **8-13 weeks** | **Complete MVP** |

---

## Appendix A: Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first CSS + accessible component library |
| Database | PostgreSQL (Supabase) | Relational database |
| Auth | Supabase Auth | Authentication and session management |
| Storage | Supabase Storage | Certificate PDFs and assets |
| Email | Resend | Transactional emails (invitations, password resets) |
| PDF Generation | React-PDF (@react-pdf/renderer) | Certificate PDF creation |
| Internationalization | next-intl | Multilingual support (PT-PT, EN) |
| Video | YouTube (unlisted embeds) | Video content delivery |
| Hosting | Vercel | Application deployment and CDN |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Unit Testing | Vitest | Fast unit test runner |
| E2E Testing | Playwright | Browser-based end-to-end tests |
| Validation | Zod | Runtime type validation for API inputs |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Cohort** | A group of 0-15 students enrolled in a course at the same time. |
| **Module** | A unit of learning within a course, containing a video and text content. |
| **Quiz** | A set of multiple choice questions at the end of a module. |
| **Final Exam** | A comprehensive assessment covering all modules, required for certification. |
| **Pass Threshold** | The minimum percentage score needed to pass the final exam (default 80%). |
| **Certificate ID** | A unique, human-readable identifier for each issued certificate (e.g., CERT-2026-00001). |
| **RLS** | Row-Level Security, a PostgreSQL feature that restricts data access at the database row level. |
| **JWT** | JSON Web Token, used for stateless session authentication. |
