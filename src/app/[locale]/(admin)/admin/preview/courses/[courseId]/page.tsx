import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocalizedField } from "@/lib/utils";
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
import { PreviewBar } from "@/components/admin/preview-bar";

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params;
  const t = await getTranslations("course");
  const tQuiz = await getTranslations("quiz");
  const supabase = await createAdminClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch course (regardless of published status for preview)
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    redirect(`/${locale}/admin/courses`);
  }

  // Fetch ALL modules (including unpublished, since this is preview)
  const { data: modulesRaw } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const modules = modulesRaw ?? [];

  // Check if exam exists
  const { count: examQuestionCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("is_exam_question", true);

  const hasExam = (examQuestionCount ?? 0) > 0;

  const courseTitle = getLocalizedField(course, "title", locale);
  const courseDescription = getLocalizedField(course, "description", locale);

  // In preview, simulate all modules as available (first) or locked (rest)
  type ModuleStatus = "locked" | "available" | "in_progress" | "completed";

  const moduleStatuses: ModuleStatus[] = modules.map((_, index) => {
    if (index === 0) return "available";
    return "locked";
  });

  return (
    <>
      <PreviewBar
        backHref={`/${locale}/admin/courses/${courseId}`}
      />

      {/* Spacer for fixed preview bar */}
      <div className="h-12" />

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Course Header */}
        <div className="mb-10">
          <h1 className="font-merriweather text-3xl font-bold tracking-tight text-primary">
            {courseTitle}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {courseDescription}
          </p>
        </div>

        {/* Module List */}
        <section className="mb-12">
          <h2 className="mb-6 font-merriweather text-xl font-semibold">
            {t("modules")}
          </h2>
          <div className="space-y-4">
            {modules.map((mod, index) => {
              const status = moduleStatuses[index];
              const moduleTitle = getLocalizedField(mod, "title", locale);
              const moduleDescription = getLocalizedField(
                mod,
                "description",
                locale
              );
              const isLocked = status === "locked";

              const statusConfig: Record<
                ModuleStatus,
                {
                  icon: React.ReactNode;
                  badge: React.ReactNode;
                }
              > = {
                locked: {
                  icon: (
                    <Lock className="h-5 w-5 text-muted-foreground/40" />
                  ),
                  badge: <Badge variant="outline">{t("locked")}</Badge>,
                },
                available: {
                  icon: <Circle className="h-5 w-5 text-primary" />,
                  badge: (
                    <Badge variant="secondary">{t("available")}</Badge>
                  ),
                },
                in_progress: {
                  icon: <PlayCircle className="h-5 w-5 text-primary" />,
                  badge: (
                    <Badge variant="default">{t("inProgress")}</Badge>
                  ),
                },
                completed: {
                  icon: <CheckCircle className="h-5 w-5 text-success" />,
                  badge: (
                    <Badge variant="success">{t("completed")}</Badge>
                  ),
                },
              };

              const config = statusConfig[status];

              // Show unpublished indicator for admin context
              const isUnpublished = !mod.is_published;

              return (
                <Card
                  key={mod.id}
                  className={`${isLocked ? "opacity-60" : ""} ${isUnpublished ? "border-dashed border-amber-300 dark:border-amber-700" : ""}`}
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
                        {isUnpublished && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                          >
                            {locale === "en" ? "Unpublished" : "Nao publicado"}
                          </Badge>
                        )}
                        {config.badge}
                      </div>
                    </div>
                  </CardHeader>

                  {!isLocked && (
                    <CardFooter>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={`/${locale}/admin/preview/courses/${courseId}/modules/${mod.id}`}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {t("startModule")}
                        </a>
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
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t("exam")}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {t("passThreshold", {
                            threshold: course.pass_threshold,
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Lock className="mr-1 h-3 w-3" />
                      {t("locked")}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </section>
          </>
        )}
      </div>
    </>
  );
}
