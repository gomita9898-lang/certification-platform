import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocalizedField, getYouTubeEmbedUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PreviewBar } from "@/components/admin/preview-bar";
import { PreviewModuleContent } from "@/components/admin/preview-module-content";

export default async function ModulePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; moduleId: string }>;
}) {
  const { locale, courseId, moduleId } = await params;
  const t = await getTranslations("course");
  const supabase = await createClient();

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

  // Fetch ALL modules for this course (including unpublished)
  const { data: allModules } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const modules = allModules ?? [];
  const currentIndex = modules.findIndex((m) => m.id === moduleId);

  if (currentIndex === -1) {
    redirect(`/${locale}/admin/preview/courses/${courseId}`);
  }

  const currentModule = modules[currentIndex];

  // Check if a quiz exists for this module
  const { count: quizQuestionCount } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId)
    .eq("is_exam_question", false);

  const hasQuiz = (quizQuestionCount ?? 0) > 0;

  const moduleTitle = getLocalizedField(currentModule, "title", locale);
  const moduleDescription = getLocalizedField(
    currentModule,
    "description",
    locale
  );
  const moduleContentText = getLocalizedField(
    currentModule,
    "content",
    locale
  );
  const videoUrl = currentModule.video_url;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule =
    currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  const totalModules = modules.length;
  const currentNumber = currentIndex + 1;
  const isUnpublished = !currentModule.is_published;

  return (
    <>
      <PreviewBar
        backHref={`/${locale}/admin/courses/${courseId}/modules/${moduleId}`}
      />

      {/* Spacer for fixed preview bar */}
      <div className="h-12" />

      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Unpublished indicator */}
        {isUnpublished && (
          <div className="mb-4">
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
            >
              {locale === "en" ? "Unpublished module" : "Modulo nao publicado"}
            </Badge>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <a
              href={`/${locale}/admin/preview/courses/${courseId}`}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("modules")}
            </a>
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

        {/* Module Content (preview version, no progress tracking) */}
        <PreviewModuleContent
          videoEmbedUrl={embedUrl}
          contentHtml={moduleContentText}
        />

        <Separator className="my-8" />

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {/* Quiz link */}
          {hasQuiz && (
            <div className="flex items-center gap-3">
              <Button asChild>
                <a
                  href={`/${locale}/admin/preview/courses/${courseId}/modules/${moduleId}/quiz`}
                >
                  {t("takeQuiz")}
                </a>
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            {prevModule ? (
              <Button asChild variant="outline">
                <a
                  href={`/${locale}/admin/preview/courses/${courseId}/modules/${prevModule.id}`}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {t("previousModule")}
                </a>
              </Button>
            ) : (
              <div />
            )}

            {nextModule ? (
              <Button asChild>
                <a
                  href={`/${locale}/admin/preview/courses/${courseId}/modules/${nextModule.id}`}
                >
                  {t("nextModule")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
