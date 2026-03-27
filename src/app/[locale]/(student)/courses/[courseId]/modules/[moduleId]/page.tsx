import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, Link } from "@/lib/i18n/routing";
import { getLocalizedField, getYouTubeEmbedUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ModuleContent } from "@/components/course/module-content";
import { ModuleCompleteButton } from "@/components/course/module-complete-button";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; moduleId: string }>;
}) {
  const { locale, courseId, moduleId } = await params;
  const t = await getTranslations("course");
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
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single();

  if (!enrollment) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  // Fetch all published modules for this course (for navigation and access check)
  const { data: allModules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const modules = allModules ?? [];
  const currentIndex = modules.findIndex((m) => m.id === moduleId);

  if (currentIndex === -1) {
    redirect({ href: `/courses/${courseId}`, locale });
    return null;
  }

  const currentModule = modules[currentIndex];

  // Check sequential access
  if (currentIndex > 0) {
    const { data: prevProgress } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("module_id", modules[currentIndex - 1].id)
      .maybeSingle();

    // Allow access if current module has any progress (review case) or previous is completed
    const { data: currentProgress } = await supabase
      .from("module_progress")
      .select("status")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    const previousCompleted = prevProgress?.status === "completed";
    const hasCurrentProgress = !!currentProgress;

    if (!previousCompleted && !hasCurrentProgress) {
      redirect({ href: `/courses/${courseId}`, locale });
      return null;
    }
  }

  // Check if a quiz exists for this module
  const { count: quizQuestionCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId)
    .eq("is_exam_question", false);

  const hasQuiz = (quizQuestionCount ?? 0) > 0;

  // Check quiz attempts
  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("id, passed")
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  const hasAttempted = (quizAttempts ?? []).length > 0;
  const hasPassed = (quizAttempts ?? []).some((a) => a.passed);

  // Check current module progress
  const { data: moduleProgress } = await supabase
    .from("module_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  const isCompleted = moduleProgress?.status === "completed";

  const moduleTitle = getLocalizedField(currentModule, "title", locale);
  const moduleDescription = getLocalizedField(currentModule, "description", locale);
  const moduleContentText = getLocalizedField(currentModule, "content", locale);
  const videoUrl = currentModule.video_url;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule =
    currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  // Check if next module is accessible (current must be completed)
  const nextModuleAccessible = isCompleted && nextModule;

  const totalModules = modules.length;
  const currentNumber = currentIndex + 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href={`/courses/${courseId}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("modules")}
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          {t("moduleOf", { current: currentNumber, total: totalModules })}
        </p>
        <h1 className="mt-2 font-merriweather text-3xl font-bold tracking-tight text-primary">
          {moduleTitle}
        </h1>
        {moduleDescription && (
          <p className="mt-3 text-lg text-muted-foreground">
            {moduleDescription}
          </p>
        )}
      </div>

      {/* Module Content (Client Component) */}
      <ModuleContent
        moduleId={moduleId}
        courseId={courseId}
        userId={user.id}
        videoEmbedUrl={embedUrl}
        contentHtml={moduleContentText}
        locale={locale}
      />

      <Separator className="my-8" />

      {/* Actions */}
      <div className="flex flex-col gap-4">
        {/* Quiz / Mark Complete */}
        {hasQuiz ? (
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href={`/courses/${courseId}/modules/${moduleId}/quiz`}>
                {hasAttempted ? t("retakeQuiz") : t("takeQuiz")}
              </Link>
            </Button>
            {hasPassed && (
              <span className="text-sm text-success">
                {t("moduleCompleted")}
              </span>
            )}
          </div>
        ) : (
          !isCompleted && (
            <ModuleCompleteButton
              moduleId={moduleId}
              courseId={courseId}
              label={t("completeModule")}
            />
          )
        )}

        {isCompleted && !hasQuiz && (
          <p className="text-sm text-success">{t("moduleCompleted")}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          {prevModule ? (
            <Button asChild variant="outline">
              <Link href={`/courses/${courseId}/modules/${prevModule.id}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("previousModule")}
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {nextModuleAccessible ? (
            <Button asChild>
              <Link href={`/courses/${courseId}/modules/${nextModule.id}`}>
                {t("nextModule")}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
