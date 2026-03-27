import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FileSpreadsheet } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import { ReportsClient } from "@/components/admin/reports-client";
import { Breadcrumb } from "@/components/admin/breadcrumb";

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("reports");
  const supabase = await createAdminClient();

  // Fetch all raw data without joins
  const [
    { data: courses },
    { data: profiles },
    { data: enrollmentsRaw },
    { data: modulesRaw },
    { data: moduleProgressRaw },
    { data: quizAttemptsRaw },
    { data: examAttemptsRaw },
    { data: certificatesRaw },
  ] = await Promise.all([
    supabase.from("courses").select("id, title_pt, title_en").order("title_pt"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "student"),
    supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
    supabase.from("modules").select("id, title_pt, title_en, course_id"),
    supabase.from("module_progress").select("*").order("created_at", { ascending: false }),
    supabase.from("quiz_attempts").select("*").order("completed_at", { ascending: false }),
    supabase.from("exam_attempts").select("*").order("completed_at", { ascending: false }),
    supabase.from("certificates").select("*").order("issued_at", { ascending: false }),
  ]);

  // Build lookup maps
  const profileMap = new Map<string, { full_name: string; email: string }>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  const courseMap = new Map<string, { title_pt: string; title_en: string }>();
  (courses ?? []).forEach((c) => courseMap.set(c.id, c));

  const moduleMap = new Map<string, { title_pt: string; title_en: string; course_id: string }>();
  (modulesRaw ?? []).forEach((m) => moduleMap.set(m.id, m));

  // Certified pairs for enrollment status
  const certifiedPairs = new Set(
    (certificatesRaw ?? []).map((c) => `${c.user_id}__${c.course_id}`),
  );

  // ---- Transform enrollments ----
  const enrollments = (enrollmentsRaw ?? []).map((e) => {
    const profile = profileMap.get(e.user_id);
    const course = courseMap.get(e.course_id);
    const isCertified = certifiedPairs.has(`${e.user_id}__${e.course_id}`);

    let status: "active" | "completed" | "certified" = "active";
    if (isCertified) status = "certified";
    else if (e.completed_at) status = "completed";

    return {
      studentName: profile?.full_name ?? "",
      email: profile?.email ?? "",
      courseName: course ? getLocalizedField(course, "title", locale) : "",
      enrolledDate: e.enrolled_at,
      status,
      completionDate: e.completed_at ?? null,
    };
  });

  // ---- Quiz best scores map ----
  const quizBestScores = new Map<string, number>();
  for (const qa of quizAttemptsRaw ?? []) {
    const key = `${qa.user_id}__${qa.module_id}`;
    const pct = Math.round((qa.score / qa.total_questions) * 100);
    const current = quizBestScores.get(key);
    if (current === undefined || pct > current) quizBestScores.set(key, pct);
  }

  // ---- Transform module completion ----
  const moduleCompletions = (moduleProgressRaw ?? []).map((mp) => {
    const profile = profileMap.get(mp.user_id);
    const course = courseMap.get(mp.course_id);
    const mod = moduleMap.get(mp.module_id);
    const key = `${mp.user_id}__${mp.module_id}`;

    return {
      studentName: profile?.full_name ?? "",
      courseName: course ? getLocalizedField(course, "title", locale) : "",
      moduleName: mod ? getLocalizedField(mod, "title", locale) : "",
      status: mp.status,
      bestQuizScore: quizBestScores.get(key) ?? null,
      completedDate: mp.completed_at ?? null,
    };
  });

  // ---- Transform quiz performance ----
  const quizGrouped = new Map<string, {
    studentName: string; courseName: string; moduleName: string;
    scores: number[]; lastDate: string;
  }>();

  for (const qa of quizAttemptsRaw ?? []) {
    const key = `${qa.user_id}__${qa.module_id}`;
    const pct = Math.round((qa.score / qa.total_questions) * 100);
    const profile = profileMap.get(qa.user_id);
    const course = courseMap.get(qa.course_id);
    const mod = moduleMap.get(qa.module_id);
    const existing = quizGrouped.get(key);

    if (existing) {
      existing.scores.push(pct);
      if (new Date(qa.completed_at) > new Date(existing.lastDate)) {
        existing.lastDate = qa.completed_at;
      }
    } else {
      quizGrouped.set(key, {
        studentName: profile?.full_name ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        moduleName: mod ? getLocalizedField(mod, "title", locale) : "",
        scores: [pct],
        lastDate: qa.completed_at,
      });
    }
  }

  const quizPerformance = Array.from(quizGrouped.values()).map((g) => ({
    studentName: g.studentName,
    courseName: g.courseName,
    moduleName: g.moduleName,
    attempts: g.scores.length,
    bestScore: Math.max(...g.scores),
    averageScore: Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length),
    lastAttemptDate: g.lastDate,
  }));

  // ---- Transform exam results ----
  const examGrouped = new Map<string, {
    studentName: string; courseName: string;
    bestPct: number; passed: boolean; count: number; lastDate: string;
  }>();

  for (const ea of examAttemptsRaw ?? []) {
    const key = `${ea.user_id}__${ea.course_id}`;
    const pct = Number(ea.percentage);
    const profile = profileMap.get(ea.user_id);
    const course = courseMap.get(ea.course_id);
    const existing = examGrouped.get(key);

    if (existing) {
      existing.count++;
      if (pct > existing.bestPct) existing.bestPct = pct;
      if (ea.passed) existing.passed = true;
      if (new Date(ea.completed_at) > new Date(existing.lastDate)) existing.lastDate = ea.completed_at;
    } else {
      examGrouped.set(key, {
        studentName: profile?.full_name ?? "",
        courseName: course ? getLocalizedField(course, "title", locale) : "",
        bestPct: pct, passed: ea.passed, count: 1, lastDate: ea.completed_at,
      });
    }
  }

  const examResults = Array.from(examGrouped.values()).map((g) => ({
    studentName: g.studentName, courseName: g.courseName,
    score: Math.round(g.bestPct), passed: g.passed,
    attempts: g.count, date: g.lastDate,
  }));

  // ---- Transform certificates ----
  const certificates = (certificatesRaw ?? []).map((c) => {
    const profile = profileMap.get(c.user_id);
    const course = courseMap.get(c.course_id);
    return {
      studentName: profile?.full_name ?? "",
      courseName: course ? getLocalizedField(course, "title", locale) : "",
      certificateCode: c.certificate_code,
      score: Math.round(Number(c.score_percentage)),
      issueDate: c.issued_at,
    };
  });

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: t("title") }]} />
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
