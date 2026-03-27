import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { FileSpreadsheet } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import { ReportsClient } from "@/components/admin/reports-client";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("reports");
  const supabase = await createClient();

  // ---- Fetch all data in parallel ----

  const [
    { data: courses },
    { data: enrollmentsRaw },
    { data: moduleProgressRaw },
    { data: quizAttemptsRaw },
    { data: examAttemptsRaw },
    { data: certificatesRaw },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title_pt, title_en")
      .order("title_pt", { ascending: true }),

    supabase
      .from("enrollments")
      .select(
        "id, enrolled_at, completed_at, user_id, course_id, profiles:user_id(full_name, email), courses:course_id(title_pt, title_en)",
      )
      .order("enrolled_at", { ascending: false }),

    supabase
      .from("module_progress")
      .select(
        "id, status, completed_at, user_id, module_id, course_id, profiles:user_id(full_name), courses:course_id(title_pt, title_en), modules:module_id(title_pt, title_en)",
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("quiz_attempts")
      .select(
        "id, score, total_questions, passed, completed_at, user_id, module_id, course_id, profiles:user_id(full_name), courses:course_id(title_pt, title_en), modules:module_id(title_pt, title_en)",
      )
      .order("completed_at", { ascending: false }),

    supabase
      .from("exam_attempts")
      .select(
        "id, score, total_questions, percentage, passed, completed_at, user_id, course_id, profiles:user_id(full_name), courses:course_id(title_pt, title_en)",
      )
      .order("completed_at", { ascending: false }),

    supabase
      .from("certificates")
      .select(
        "id, certificate_code, score_percentage, issued_at, user_id, course_id, profiles:user_id(full_name), courses:course_id(title_pt, title_en)",
      )
      .order("issued_at", { ascending: false }),
  ]);

  // ---- Transform enrollments ----

  const enrollments = (enrollmentsRaw ?? []).map((e: Record<string, unknown>) => {
    const profile = e.profiles as Record<string, unknown> | null;
    const course = e.courses as Record<string, unknown> | null;

    // Determine status
    let status: "active" | "completed" | "certified" = "active";
    if (e.completed_at) {
      status = "completed";
    }

    return {
      studentName: (profile?.full_name as string) ?? "",
      email: (profile?.email as string) ?? "",
      courseName: course ? getLocalizedField(course, "title", locale) : "",
      enrolledDate: e.enrolled_at as string,
      status,
      completionDate: (e.completed_at as string) ?? null,
    };
  });

  // Check which enrollments have certificates
  const certifiedPairs = new Set(
    (certificatesRaw ?? []).map(
      (c: Record<string, unknown>) => `${c.user_id}__${c.course_id}`,
    ),
  );
  for (const enrollment of enrollments) {
    // Find the matching raw enrollment to get user_id + course_id
    const rawMatch = (enrollmentsRaw ?? []).find(
      (r: Record<string, unknown>) => {
        const p = r.profiles as Record<string, unknown> | null;
        return (
          (p?.full_name as string) === enrollment.studentName &&
          (p?.email as string) === enrollment.email
        );
      },
    );
    if (rawMatch) {
      const key = `${(rawMatch as Record<string, unknown>).user_id}__${(rawMatch as Record<string, unknown>).course_id}`;
      if (certifiedPairs.has(key)) {
        enrollment.status = "certified";
      }
    }
  }

  // ---- Transform module completion ----

  // Group quiz attempts by user+module to get best score
  const quizBestScores = new Map<string, number>();
  for (const qa of quizAttemptsRaw ?? []) {
    const a = qa as Record<string, unknown>;
    const key = `${a.user_id}__${a.module_id}`;
    const pct = Math.round(
      ((a.score as number) / (a.total_questions as number)) * 100,
    );
    const current = quizBestScores.get(key);
    if (current === undefined || pct > current) {
      quizBestScores.set(key, pct);
    }
  }

  const moduleCompletions = (moduleProgressRaw ?? []).map(
    (mp: Record<string, unknown>) => {
      const profile = mp.profiles as Record<string, unknown> | null;
      const course = mp.courses as Record<string, unknown> | null;
      const mod = mp.modules as Record<string, unknown> | null;
      const key = `${mp.user_id}__${mp.module_id}`;

      return {
        studentName: (profile?.full_name as string) ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        moduleName: mod ? getLocalizedField(mod, "title", locale) : "",
        status: mp.status as string,
        bestQuizScore: quizBestScores.get(key) ?? null,
        completedDate: (mp.completed_at as string) ?? null,
      };
    },
  );

  // ---- Transform quiz performance ----

  // Group quiz attempts by user + module
  const quizGrouped = new Map<
    string,
    {
      studentName: string;
      courseName: string;
      moduleName: string;
      scores: number[];
      lastDate: string;
    }
  >();
  for (const qa of quizAttemptsRaw ?? []) {
    const a = qa as Record<string, unknown>;
    const profile = a.profiles as Record<string, unknown> | null;
    const course = a.courses as Record<string, unknown> | null;
    const mod = a.modules as Record<string, unknown> | null;
    const key = `${a.user_id}__${a.module_id}`;

    const pct = Math.round(
      ((a.score as number) / (a.total_questions as number)) * 100,
    );
    const existing = quizGrouped.get(key);

    if (existing) {
      existing.scores.push(pct);
      if (
        new Date(a.completed_at as string) > new Date(existing.lastDate)
      ) {
        existing.lastDate = a.completed_at as string;
      }
    } else {
      quizGrouped.set(key, {
        studentName: (profile?.full_name as string) ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        moduleName: mod ? getLocalizedField(mod, "title", locale) : "",
        scores: [pct],
        lastDate: a.completed_at as string,
      });
    }
  }

  const quizPerformance = Array.from(quizGrouped.values()).map((g) => ({
    studentName: g.studentName,
    courseName: g.courseName,
    moduleName: g.moduleName,
    attempts: g.scores.length,
    bestScore: Math.max(...g.scores),
    averageScore: Math.round(
      g.scores.reduce((a, b) => a + b, 0) / g.scores.length,
    ),
    lastAttemptDate: g.lastDate,
  }));

  // ---- Transform exam results ----

  // Group by user + course
  const examGrouped = new Map<
    string,
    {
      studentName: string;
      courseName: string;
      bestPct: number;
      passed: boolean;
      count: number;
      lastDate: string;
    }
  >();
  for (const ea of examAttemptsRaw ?? []) {
    const a = ea as Record<string, unknown>;
    const profile = a.profiles as Record<string, unknown> | null;
    const course = a.courses as Record<string, unknown> | null;
    const key = `${a.user_id}__${a.course_id}`;
    const pct = Number(a.percentage);

    const existing = examGrouped.get(key);
    if (existing) {
      existing.count++;
      if (pct > existing.bestPct) {
        existing.bestPct = pct;
      }
      if (a.passed) {
        existing.passed = true;
      }
      if (
        new Date(a.completed_at as string) > new Date(existing.lastDate)
      ) {
        existing.lastDate = a.completed_at as string;
      }
    } else {
      examGrouped.set(key, {
        studentName: (profile?.full_name as string) ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        bestPct: pct,
        passed: a.passed as boolean,
        count: 1,
        lastDate: a.completed_at as string,
      });
    }
  }

  const examResults = Array.from(examGrouped.values()).map((g) => ({
    studentName: g.studentName,
    courseName: g.courseName,
    score: Math.round(g.bestPct),
    passed: g.passed,
    attempts: g.count,
    date: g.lastDate,
  }));

  // ---- Transform certificates ----

  const certificates = (certificatesRaw ?? []).map(
    (c: Record<string, unknown>) => {
      const profile = c.profiles as Record<string, unknown> | null;
      const course = c.courses as Record<string, unknown> | null;

      return {
        studentName: (profile?.full_name as string) ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        certificateCode: c.certificate_code as string,
        score: Math.round(Number(c.score_percentage)),
        issueDate: c.issued_at as string,
      };
    },
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-merriweather flex items-center gap-3 text-3xl font-bold tracking-tight">
          <FileSpreadsheet className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ReportsClient
        courses={courses ?? []}
        enrollments={enrollments}
        moduleCompletions={moduleCompletions}
        quizPerformance={quizPerformance}
        examResults={examResults}
        certificates={certificates}
        locale={locale}
      />
    </div>
  );
}
