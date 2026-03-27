import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocalizedField } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { PreviewBar } from "@/components/admin/preview-bar";

export default async function QuizPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string; moduleId: string }>;
}) {
  const { locale, courseId, moduleId } = await params;
  const t = await getTranslations("quiz");
  const tCourse = await getTranslations("course");
  const tPreview = await getTranslations("admin.preview");
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

  // Fetch module title
  const { data: moduleData } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (!moduleData) {
    redirect(`/${locale}/admin/preview/courses/${courseId}`);
  }

  const moduleTitle = getLocalizedField(moduleData, "title", locale);

  // Fetch questions for this module
  const { data: questionsData } = await supabase
    .from("questions")
    .select("*")
    .eq("module_id", moduleId)
    .eq("is_exam_question", false)
    .order("order_index", { ascending: true });

  const questions = questionsData ?? [];

  // Fetch options for all questions
  const questionIds = questions.map((q) => q.id);
  let optionsData: Array<{
    id: string;
    question_id: string;
    text_pt: string;
    text_en: string;
    is_correct: boolean;
    order_index: number;
  }> = [];

  if (questionIds.length > 0) {
    const { data } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    optionsData = (data ?? []) as typeof optionsData;
  }

  return (
    <>
      <PreviewBar
        backHref={`/${locale}/admin/courses/${courseId}/modules/${moduleId}`}
      />

      {/* Spacer for fixed preview bar */}
      <div className="h-12" />

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
            <a
              href={`/${locale}/admin/preview/courses/${courseId}/modules/${moduleId}`}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {tCourse("module")}
            </a>
          </Button>
          <h1 className="font-merriweather text-2xl font-bold text-primary">
            {t("title", { module: moduleTitle })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tPreview("quizReadOnly")}
          </p>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">
                {locale === "en"
                  ? "No questions found for this module."
                  : "Nenhuma pergunta encontrada para este modulo."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const questionText = getLocalizedField(q, "question", locale);
              const explanation = getLocalizedField(q, "explanation", locale);
              const qOptions = optionsData
                .filter((o) => o.question_id === q.id)
                .sort((a, b) => a.order_index - b.order_index);

              return (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("question", {
                            current: idx + 1,
                            total: questions.length,
                          })}
                        </p>
                        <CardTitle className="text-base">
                          {questionText}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qOptions.map((opt) => {
                        const optionText = getLocalizedField(
                          opt,
                          "text",
                          locale
                        );
                        const isCorrect = opt.is_correct;

                        return (
                          <div
                            key={opt.id}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                              isCorrect
                                ? "border-success/50 bg-success/10 text-success-foreground"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrect && (
                                <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                              )}
                              <span>{optionText}</span>
                              {isCorrect && (
                                <Badge
                                  variant="success"
                                  className="ml-auto text-xs"
                                >
                                  {t("correctAnswer")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {explanation && (
                      <div className="mt-4 rounded-lg bg-muted p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          {t("explanation")}
                        </p>
                        <p className="text-sm">{explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Back to module preview */}
        <div className="mt-8">
          <Button asChild variant="outline">
            <a
              href={`/${locale}/admin/preview/courses/${courseId}/modules/${moduleId}`}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("returnToCourse")}
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
