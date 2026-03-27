import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, Link } from "@/lib/i18n/routing";
import { getLocalizedField, formatPercentage } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Lock,
  CheckCircle,
  Circle,
  PlayCircle,
  FileText,
  Award,
} from "lucide-react";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const t = await getTranslations("course");
  const tQuiz = await getTranslations("quiz");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!enrollment) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  // Fetch course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  // Fetch modules
  const { data: modulesRaw } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const modules = modulesRaw ?? [];

  // Fetch module progress
  const { data: progressData } = await supabase
    .from("module_progress")
    .select("module_id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId);

  const progressMap = new Map(
    (progressData ?? []).map((p) => [p.module_id, p.status])
  );

  // Fetch best quiz scores per module
  const moduleIds = modules.map((m) => m.id);
  let quizScoreMap = new Map<string, number>();

  if (moduleIds.length > 0) {
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select("module_id, score, total_questions")
      .eq("user_id", user.id)
      .in("module_id", moduleIds);

    for (const attempt of quizAttempts ?? []) {
      const pct = Math.round((attempt.score / attempt.total_questions) * 100);
      const current = quizScoreMap.get(attempt.module_id);
      if (current === undefined || pct > current) {
        quizScoreMap.set(attempt.module_id, pct);
      }
    }
  }

  // Check if exam exists
  const { count: examQuestionCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("is_exam_question", true);

  // Check for existing certificate
  const { data: certificate } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .limit(1)
    .maybeSingle();

  // Determine module statuses with sequential logic
  type ModuleStatus = "locked" | "available" | "in_progress" | "completed";

  const moduleStatuses: ModuleStatus[] = modules.map((mod, index) => {
    const progress = progressMap.get(mod.id);

    if (progress === "completed") return "completed";
    if (progress === "in_progress") return "in_progress";

    // First module is always available
    if (index === 0) return "available";

    // Check if the previous module is completed
    const prevModuleId = modules[index - 1].id;
    const prevStatus = progressMap.get(prevModuleId);
    if (prevStatus === "completed") return "available";

    return "locked";
  });

  const allModulesCompleted = modules.every(
    (_, i) => moduleStatuses[i] === "completed"
  );
  const hasExam = (examQuestionCount ?? 0) > 0;

  const courseTitle = getLocalizedField(course, "title", locale);
  const courseDescription = getLocalizedField(course, "description", locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Course Header */}
      <div className="mb-10">
        <h1 className="font-merriweather text-3xl font-bold tracking-tight text-primary">
          {courseTitle}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{courseDescription}</p>
      </div>

      {/* All modules completed notice */}
      {allModulesCompleted && hasExam && !certificate && (
        <Card className="mb-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <Award className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t("allModulesCompleted")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Module List */}
      <section className="mb-12">
        <h2 className="mb-6 font-merriweather text-xl font-semibold">
          {t("modules")}
        </h2>
        <div className="space-y-4">
          {modules.map((mod, index) => {
            const status = moduleStatuses[index];
            const moduleTitle = getLocalizedField(mod, "title", locale);
            const moduleDescription = getLocalizedField(mod, "description", locale);
            const quizScore = quizScoreMap.get(mod.id);
            const isLocked = status === "locked";

            const statusConfig: Record<
              ModuleStatus,
              {
                icon: React.ReactNode;
                badge: React.ReactNode;
                variant: "default" | "secondary" | "success" | "outline";
              }
            > = {
              locked: {
                icon: <Lock className="h-5 w-5 text-muted-foreground/40" />,
                badge: <Badge variant="outline">{t("locked")}</Badge>,
                variant: "outline",
              },
              available: {
                icon: <Circle className="h-5 w-5 text-primary" />,
                badge: <Badge variant="secondary">{t("available")}</Badge>,
                variant: "secondary",
              },
              in_progress: {
                icon: <PlayCircle className="h-5 w-5 text-primary" />,
                badge: <Badge variant="default">{t("inProgress")}</Badge>,
                variant: "default",
              },
              completed: {
                icon: <CheckCircle className="h-5 w-5 text-success" />,
                badge: <Badge variant="success">{t("completed")}</Badge>,
                variant: "success",
              },
            };

            const config = statusConfig[status];

            return (
              <Card
                key={mod.id}
                className={isLocked ? "opacity-60" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {moduleTitle}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {moduleDescription}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {quizScore !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {t("quizScore", { score: quizScore })}
                        </span>
                      )}
                      {config.badge}
                    </div>
                  </div>
                </CardHeader>

                {!isLocked && (
                  <CardFooter>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/courses/${courseId}/modules/${mod.id}`}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {status === "completed"
                          ? t("reviewModule")
                          : status === "in_progress"
                            ? t("continueModule")
                            : t("startModule")}
                      </Link>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Final Exam Section */}
      {hasExam && (
        <>
          <Separator className="mb-8" />
          <section>
            <Card
              className={
                !allModulesCompleted ? "opacity-60" : "border-primary/30"
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("exam")}</CardTitle>
                      <CardDescription className="mt-1">
                        {t("passThreshold", {
                          threshold: course.pass_threshold,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  {!allModulesCompleted ? (
                    <Badge variant="outline">
                      <Lock className="mr-1 h-3 w-3" />
                      {t("locked")}
                    </Badge>
                  ) : certificate ? (
                    <Badge variant="success">{t("completed")}</Badge>
                  ) : (
                    <Badge variant="default">{t("available")}</Badge>
                  )}
                </div>
              </CardHeader>

              {allModulesCompleted && (
                <CardFooter>
                  {certificate ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/certificates/${certificate.id}`}>
                        <Award className="mr-2 h-4 w-4" />
                        {tQuiz("viewCertificate")}
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link href={`/courses/${courseId}/exam`}>
                        <FileText className="mr-2 h-4 w-4" />
                        {t("exam")}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
