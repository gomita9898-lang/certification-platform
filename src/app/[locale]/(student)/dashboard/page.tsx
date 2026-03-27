import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/lib/i18n/routing";
import { Link } from "@/lib/i18n/routing";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, ArrowRight } from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, enrolled_at, completed_at")
    .eq("user_id", user.id);

  const courseIds = enrollments?.map((e) => e.course_id) ?? [];

  let courses: Array<{
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    modules_count: number;
    completed_modules: number;
    has_certificate: boolean;
    enrollment_completed: boolean;
  }> = [];

  if (courseIds.length > 0) {
    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    const { data: modules } = await supabase
      .from("modules")
      .select("id, course_id")
      .in("course_id", courseIds)
      .eq("is_published", true);

    const { data: moduleProgress } = await supabase
      .from("module_progress")
      .select("module_id, course_id, status")
      .eq("user_id", user.id)
      .in("course_id", courseIds)
      .eq("status", "completed");

    const { data: certificates } = await supabase
      .from("certificates")
      .select("course_id")
      .eq("user_id", user.id)
      .in("course_id", courseIds);

    const certifiedCourseIds = new Set(
      certificates?.map((c) => c.course_id) ?? []
    );

    courses = (coursesData ?? []).map((course) => {
      const courseModules =
        modules?.filter((m) => m.course_id === course.id) ?? [];
      const completedModules =
        moduleProgress?.filter((mp) => mp.course_id === course.id) ?? [];
      const enrollment = enrollments?.find((e) => e.course_id === course.id);

      return {
        id: course.id,
        title: getLocalizedField(course, "title", locale),
        description: getLocalizedField(course, "description", locale),
        image_url: course.image_url,
        modules_count: courseModules.length,
        completed_modules: completedModules.length,
        has_certificate: certifiedCourseIds.has(course.id),
        enrollment_completed: !!enrollment?.completed_at,
      };
    });
  }

  const studentName = profile?.full_name ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-merriweather text-3xl font-bold tracking-tight text-primary">
          {t("welcome", { name: studentName })}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("title")}</p>
      </div>

      <section>
        <h2 className="mb-6 font-merriweather text-xl font-semibold text-foreground">
          {t("myCourses")}
        </h2>

        {courses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-center text-muted-foreground">
                {t("noCourses")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const progressPercent =
                course.modules_count > 0
                  ? Math.round(
                      (course.completed_modules / course.modules_count) * 100
                    )
                  : 0;

              const allModulesCompleted =
                course.modules_count > 0 &&
                course.completed_modules >= course.modules_count;

              let statusVariant: "default" | "secondary" | "success" | "warning" =
                "secondary";
              let statusLabel = t("inProgress");

              if (course.has_certificate) {
                statusVariant = "success";
                statusLabel = t("courseCompleted");
              } else if (allModulesCompleted) {
                statusVariant = "warning";
                statusLabel = t("examPending");
              } else if (course.completed_modules === 0) {
                statusVariant = "secondary";
                statusLabel = t("inProgress");
              }

              let actionLabel: string;
              let actionHref: string;

              if (course.has_certificate) {
                actionLabel = t("viewCertificate");
                actionHref = "/certificates";
              } else if (course.completed_modules === 0) {
                actionLabel = t("startCourse");
                actionHref = `/courses/${course.id}`;
              } else {
                actionLabel = t("continueStudying");
                actionHref = `/courses/${course.id}`;
              }

              return (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("progress")}
                        </span>
                        <span className="font-medium">
                          {formatPercentage(progressPercent)}
                        </span>
                      </div>
                      <Progress value={progressPercent} />
                      <p className="text-xs text-muted-foreground">
                        {t("modulesCompleted", {
                          completed: course.completed_modules,
                          total: course.modules_count,
                        })}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={actionHref}>
                        {actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
