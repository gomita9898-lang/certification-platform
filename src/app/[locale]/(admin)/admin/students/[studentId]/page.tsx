import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Award, BookOpen, BarChart3 } from "lucide-react";
import { formatDate, formatPercentage, getLocalizedField } from "@/lib/utils";
import { ResetProgressMenu } from "@/components/admin/reset-progress-menu";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; studentId: string }>;
}) {
  const { locale, studentId } = await params;
  const t = await getTranslations("admin");
  const tCourse = await getTranslations("course");

  const supabase = await createAdminClient();

  // Fetch student profile
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    );
  }

  // Fetch enrollments with course data
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, courses(id, title_pt, title_en, pass_threshold)")
    .eq("user_id", studentId)
    .order("enrolled_at", { ascending: false }) as { data: Array<{
      id: string;
      user_id: string;
      course_id: string;
      enrolled_at: string;
      completed_at: string | null;
      courses: { id: string; title_pt: string; title_en: string; pass_threshold: number } | null;
    }> | null };

  // Fetch module progress
  const { data: moduleProgress } = await supabase
    .from("module_progress")
    .select("*, modules(title_pt, title_en, order_index)")
    .eq("user_id", studentId)
    .order("updated_at", { ascending: false }) as { data: Array<{
      id: string;
      user_id: string;
      module_id: string;
      course_id: string;
      status: "not_started" | "in_progress" | "completed";
      completed_at: string | null;
      created_at: string;
      updated_at: string;
      modules: { title_pt: string; title_en: string; order_index: number } | null;
    }> | null };

  // Fetch quiz attempts
  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("*, modules(title_pt, title_en)")
    .eq("user_id", studentId)
    .order("completed_at", { ascending: false }) as { data: Array<{
      id: string;
      user_id: string;
      module_id: string;
      course_id: string;
      score: number;
      total_questions: number;
      passed: boolean;
      completed_at: string;
      modules: { title_pt: string; title_en: string } | null;
    }> | null };

  // Fetch exam attempts
  const { data: examAttempts } = await supabase
    .from("exam_attempts")
    .select("*, courses(title_pt, title_en)")
    .eq("user_id", studentId)
    .order("completed_at", { ascending: false }) as { data: Array<{
      id: string;
      user_id: string;
      course_id: string;
      score: number;
      total_questions: number;
      percentage: number;
      passed: boolean;
      completed_at: string;
      courses: { title_pt: string; title_en: string } | null;
    }> | null };

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*, courses(title_pt, title_en)")
    .eq("user_id", studentId) as { data: Array<{
      id: string;
      user_id: string;
      course_id: string;
      exam_attempt_id: string;
      certificate_code: string;
      score_percentage: number;
      issued_at: string;
      courses: { title_pt: string; title_en: string } | null;
    }> | null };

  // Fetch total modules per course for progress calculation
  const enrollmentList = enrollments ?? [];
  const courseIds = enrollmentList
    .map((e: { courses: { id: string } | null }) => e.courses?.id)
    .filter(Boolean) as string[];

  const { data: allModules } = await supabase
    .from("modules")
    .select("id, course_id, title_pt, title_en, order_index")
    .in("course_id", courseIds.length > 0 ? courseIds : ["__none__"])
    .order("order_index", { ascending: true });

  const moduleCountByCourse: Record<string, number> = {};
  (allModules ?? []).forEach((m) => {
    moduleCountByCourse[m.course_id] =
      (moduleCountByCourse[m.course_id] || 0) + 1;
  });

  const completedModulesByCourse: Record<string, number> = {};
  (moduleProgress ?? [])
    .filter((mp) => mp.status === "completed")
    .forEach((mp) => {
      completedModulesByCourse[mp.course_id] =
        (completedModulesByCourse[mp.course_id] || 0) + 1;
    });

  // Build timeline from all activities
  const timeline: Array<{
    date: string;
    type: "enrollment" | "module" | "quiz" | "exam" | "certificate";
    description: string;
    detail?: string;
  }> = [];

  enrollmentList.forEach(
    (e: {
      enrolled_at: string;
      courses: { title_pt: string; title_en: string } | null;
    }) => {
      const courseTitle = e.courses
        ? getLocalizedField(e.courses, "title", locale)
        : "";
      timeline.push({
        date: e.enrolled_at,
        type: "enrollment",
        description:
          locale === "en" ? "Enrolled in course" : "Inscrito no curso",
        detail: courseTitle,
      });
    }
  );

  (moduleProgress ?? [])
    .filter((mp) => mp.status === "completed" && mp.completed_at)
    .forEach(
      (mp: {
        completed_at: string | null;
        modules: { title_pt: string; title_en: string } | null;
      }) => {
        const modTitle = mp.modules
          ? getLocalizedField(mp.modules, "title", locale)
          : "";
        timeline.push({
          date: mp.completed_at!,
          type: "module",
          description:
            locale === "en" ? "Completed module" : "Modulo concluido",
          detail: modTitle,
        });
      }
    );

  (quizAttempts ?? []).forEach(
    (qa: {
      completed_at: string;
      score: number;
      total_questions: number;
      modules: { title_pt: string; title_en: string } | null;
    }) => {
      const modTitle = qa.modules
        ? getLocalizedField(qa.modules, "title", locale)
        : "";
      const pct =
        qa.total_questions > 0
          ? Math.round((qa.score / qa.total_questions) * 100)
          : 0;
      timeline.push({
        date: qa.completed_at,
        type: "quiz",
        description:
          locale === "en" ? "Completed quiz" : "Questionario concluido",
        detail: `${modTitle} (${pct}%)`,
      });
    }
  );

  (examAttempts ?? []).forEach(
    (ea: {
      completed_at: string;
      percentage: number;
      passed: boolean;
      courses: { title_pt: string; title_en: string } | null;
    }) => {
      const courseTitle = ea.courses
        ? getLocalizedField(ea.courses, "title", locale)
        : "";
      timeline.push({
        date: ea.completed_at,
        type: "exam",
        description: locale === "en" ? "Took exam" : "Realizou exame",
        detail: `${courseTitle} (${Math.round(ea.percentage)}% - ${
          ea.passed
            ? locale === "en"
              ? "Passed"
              : "Aprovado"
            : locale === "en"
            ? "Failed"
            : "Reprovado"
        })`,
      });
    }
  );

  (certificates ?? []).forEach(
    (c: {
      issued_at: string;
      courses: { title_pt: string; title_en: string } | null;
    }) => {
      const courseTitle = c.courses
        ? getLocalizedField(c.courses, "title", locale)
        : "";
      timeline.push({
        date: c.issued_at,
        type: "certificate",
        description:
          locale === "en" ? "Certificate issued" : "Certificado emitido",
        detail: courseTitle,
      });
    }
  );

  timeline.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const typeColors: Record<string, string> = {
    enrollment: "bg-blue-500",
    module: "bg-emerald-500",
    quiz: "bg-amber-500",
    exam: "bg-purple-500",
    certificate: "bg-primary",
  };

  return (
    <div className="space-y-8">
      {/* Student header */}
      <div>
        <h1 className="font-merriweather text-3xl font-bold tracking-tight">
          {student.full_name}
        </h1>
        <p className="mt-1 text-muted-foreground">{student.email}</p>
        <p className="text-sm text-muted-foreground">
          {t("enrolledOn")}: {formatDate(student.created_at, locale)}
        </p>
      </div>

      {/* Per-course progress */}
      <div className="grid gap-4">
        {enrollmentList.map(
          (enrollment: {
            id: string;
            enrolled_at: string;
            completed_at: string | null;
            courses: {
              id: string;
              title_pt: string;
              title_en: string;
              pass_threshold: number;
            } | null;
          }) => {
            if (!enrollment.courses) return null;
            const course = enrollment.courses;
            const courseTitle = getLocalizedField(course, "title", locale);
            const totalMods = moduleCountByCourse[course.id] ?? 0;
            const completedMods = completedModulesByCourse[course.id] ?? 0;
            const progressPct =
              totalMods > 0 ? (completedMods / totalMods) * 100 : 0;

            const courseExams = (examAttempts ?? []).filter(
              (ea: { course_id: string }) => ea.course_id === course.id
            );
            const bestExam = courseExams.sort(
              (a: { percentage: number }, b: { percentage: number }) =>
                b.percentage - a.percentage
            )[0] as { percentage: number; passed: boolean } | undefined;

            const courseCert = (certificates ?? []).find(
              (c: { course_id: string }) => c.course_id === course.id
            );

            const courseModules = (allModules ?? [])
              .filter((m) => m.course_id === course.id)
              .map((m) => ({
                id: m.id,
                title: getLocalizedField(m, "title", locale),
                order_index: m.order_index,
              }));

            return (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{courseTitle}</CardTitle>
                    <div className="flex items-center gap-2">
                      {courseCert ? (
                        <Badge variant="success">
                          <Award className="mr-1 h-3 w-3" />
                          {t("certified")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("notCertified")}</Badge>
                      )}
                      <ResetProgressMenu
                        studentId={studentId}
                        courseId={course.id}
                        courseTitle={courseTitle}
                        modules={courseModules}
                      />
                    </div>
                  </div>
                  <CardDescription>
                    {t("enrolledOn")}: {formatDate(enrollment.enrolled_at, locale)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Module progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        {t("modulesCompleted")}
                      </span>
                      <span className="font-medium">
                        {completedMods} / {totalMods}
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>

                  {/* Exam info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4" />
                      {t("examScore")}
                    </span>
                    <span className="font-medium">
                      {bestExam
                        ? `${formatPercentage(bestExam.percentage)} (${
                            courseExams.length
                          } ${
                            locale === "en" ? "attempts" : "tentativas"
                          })`
                        : "—"}
                    </span>
                  </div>

                  {/* Quiz scores for this course */}
                  {(quizAttempts ?? [])
                    .filter(
                      (qa: { course_id: string }) =>
                        qa.course_id === course.id
                    )
                    .slice(0, 5)
                    .map(
                      (qa: {
                        id: string;
                        score: number;
                        total_questions: number;
                        modules: {
                          title_pt: string;
                          title_en: string;
                        } | null;
                      }) => {
                        const modTitle = qa.modules
                          ? getLocalizedField(qa.modules, "title", locale)
                          : "";
                        const pct =
                          qa.total_questions > 0
                            ? (qa.score / qa.total_questions) * 100
                            : 0;
                        return (
                          <div key={qa.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{modTitle}</span>
                              <span>{formatPercentage(pct)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 70 ? "bg-success" : "bg-destructive"
                                }`}
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Activity timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "en" ? "Activity Timeline" : "Cronologia de Atividade"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {locale === "en" ? "No activity yet" : "Sem atividade"}
            </p>
          ) : (
            <div className="relative space-y-0">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full ${
                      typeColors[item.type]
                    }`}
                  />
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    {item.detail && (
                      <p className="text-sm text-muted-foreground">
                        {item.detail}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(item.date, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
