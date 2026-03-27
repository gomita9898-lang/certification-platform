"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/lib/i18n/routing";
import {
  getLocalizedField,
  generateCertificateCode,
  formatPercentage,
} from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Award,
} from "lucide-react";

interface ExamQuestion {
  id: string;
  question: string;
  explanation: string | null;
  options: {
    id: string;
    text: string;
    is_correct: boolean;
    order_index: number;
  }[];
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  certificateId: string | null;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
}

export default function ExamPage() {
  const t = useTranslations("quiz");
  const tCourse = useTranslations("course");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;
  const locale = params.locale as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [passThreshold, setPassThreshold] = useState(80);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (!enrollment) {
      router.push("/dashboard");
      return;
    }

    // Fetch course for title and pass threshold
    const { data: course } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (course) {
      setCourseTitle(getLocalizedField(course, "title", locale));
      setPassThreshold(course.pass_threshold);
    }

    // Verify all modules are completed
    const { data: allModules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId)
      .eq("is_published", true);

    if (allModules && allModules.length > 0) {
      const { data: completedModules } = await supabase
        .from("module_progress")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "completed");

      const completedIds = new Set(
        (completedModules ?? []).map((m) => m.module_id)
      );
      const allCompleted = allModules.every((m) => completedIds.has(m.id));

      if (!allCompleted) {
        router.push(`/courses/${courseId}`);
        return;
      }
    }

    // Fetch exam questions
    const { data: questionsData, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("course_id", courseId)
      .eq("is_exam_question", true)
      .order("order_index", { ascending: true });

    if (qError || !questionsData || questionsData.length === 0) {
      setError(tCommon("noResults"));
      setLoading(false);
      return;
    }

    const questionIds = questionsData.map((q) => q.id);
    const { data: optionsData } = await supabase
      .from("question_options")
      .select("*")
      .in("question_id", questionIds)
      .order("order_index", { ascending: true });

    const mapped: ExamQuestion[] = questionsData.map((q) => ({
      id: q.id,
      question: getLocalizedField(q, "question", locale),
      explanation: getLocalizedField(q, "explanation", locale) || null,
      options: (optionsData ?? [])
        .filter((o) => o.question_id === q.id)
        .map((o) => ({
          id: o.id,
          text: getLocalizedField(o, "text", locale),
          is_correct: o.is_correct,
          order_index: o.order_index,
        })),
    }));

    setQuestions(mapped);
    setLoading(false);
  }, [courseId, locale, tCommon, router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function handleSelectAnswer(optionId: string) {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionId,
    }));
  }

  async function handleSubmit() {
    const unansweredCount = questions.filter((q) => !answers[q.id]).length;
    if (unansweredCount > 0) {
      const confirmMsg = `${t("unanswered", { count: unansweredCount })}\n\n${t("confirmSubmit")}`;
      if (!window.confirm(confirmMsg)) return;
    } else {
      if (!window.confirm(t("confirmSubmit"))) return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Calculate score
    let score = 0;
    const answerRecords: ExamResult["answers"] = [];

    for (const q of questions) {
      const selectedId = answers[q.id];
      const correctOption = q.options.find((o) => o.is_correct);
      const isCorrect = selectedId === correctOption?.id;
      if (isCorrect) score++;

      answerRecords.push({
        questionId: q.id,
        selectedOptionId: selectedId || "",
        isCorrect,
      });
    }

    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= passThreshold;

    // Create exam attempt
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .insert({
        user_id: user.id,
        course_id: courseId,
        score,
        total_questions: totalQuestions,
        percentage,
        passed,
      })
      .select("id")
      .single();

    // Create exam answers
    if (attempt) {
      const answersToInsert = answerRecords
        .filter((a) => a.selectedOptionId)
        .map((a) => ({
          attempt_id: attempt.id,
          question_id: a.questionId,
          selected_option_id: a.selectedOptionId,
          is_correct: a.isCorrect,
        }));

      if (answersToInsert.length > 0) {
        await supabase.from("exam_answers").insert(answersToInsert);
      }
    }

    let certificateId: string | null = null;

    if (passed && attempt) {
      // Generate certificate
      const certCode = generateCertificateCode();
      const { data: certificate } = await supabase
        .from("certificates")
        .insert({
          user_id: user.id,
          course_id: courseId,
          exam_attempt_id: attempt.id,
          certificate_code: certCode,
          score_percentage: percentage,
        })
        .select("id")
        .single();

      certificateId = certificate?.id ?? null;

      // Mark enrollment as completed
      await supabase
        .from("enrollments")
        .update({ completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
    }

    setResult({
      score,
      totalQuestions,
      percentage,
      passed,
      certificateId,
      answers: answerRecords,
    });
    setCurrentIndex(0);
    setSubmitting(false);
  }

  function handleRetake() {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results view
  if (result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 font-merriweather text-2xl font-bold text-primary">
          {t("results")}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {t("examTitle", { course: courseTitle })}
        </p>

        {/* Score summary */}
        <Card className="mb-8">
          <CardContent className="py-8 text-center">
            <p className="text-4xl font-bold text-primary">
              {t("yourScore", { score: result.percentage })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {tCourse("passThreshold", { threshold: passThreshold })}
            </p>
            <div className="mt-4">
              {result.passed ? (
                <Badge variant="success" className="text-sm px-4 py-1">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t("passed")}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-sm px-4 py-1">
                  <XCircle className="mr-1 h-4 w-4" />
                  {t("failed")}
                </Badge>
              )}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {result.passed
                ? t("examPassedMessage")
                : t("examFailedMessage", { threshold: passThreshold })}
            </p>
          </CardContent>
        </Card>

        {/* Questions review */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const answer = result.answers.find((a) => a.questionId === q.id);
            const isCorrect = answer?.isCorrect ?? false;

            return (
              <Card key={q.id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("question", { current: idx + 1, total: questions.length })}
                      </p>
                      <CardTitle className="text-base">{q.question}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = answer?.selectedOptionId === opt.id;
                      const isCorrectOption = opt.is_correct;

                      let optionClass =
                        "rounded-lg border px-4 py-3 text-sm transition-colors";
                      if (isCorrectOption) {
                        optionClass +=
                          " border-success/50 bg-success/10 text-success-foreground";
                      } else if (isSelected && !isCorrectOption) {
                        optionClass +=
                          " border-destructive/50 bg-destructive/10 text-destructive-foreground";
                      } else {
                        optionClass += " border-border";
                      }

                      return (
                        <div key={opt.id} className={optionClass}>
                          <div className="flex items-center gap-2">
                            {isCorrectOption && (
                              <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                            )}
                            {isSelected && !isCorrectOption && (
                              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                            )}
                            <span>{opt.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="mt-4 rounded-lg bg-muted p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {t("explanation")}
                      </p>
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {result.passed && result.certificateId ? (
            <Button asChild>
              <Link href={`/certificates/${result.certificateId}`}>
                <Award className="mr-2 h-4 w-4" />
                {t("viewCertificate")}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={handleRetake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href={`/courses/${courseId}`}>{t("returnToCourse")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Exam taking view
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href={`/courses/${courseId}`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("returnToCourse")}
          </Link>
        </Button>
        <h1 className="font-merriweather text-2xl font-bold text-primary">
          {t("examTitle", { course: courseTitle })}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tCourse("passThreshold", { threshold: passThreshold })}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("question", {
              current: currentIndex + 1,
              total: questions.length,
            })}
          </span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent ${
                  selectedAnswer === option.id
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selectedAnswer === option.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedAnswer === option.id && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {tCommon("previous")}
          </Button>

          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submitExam")}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>
              {tCommon("next")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
