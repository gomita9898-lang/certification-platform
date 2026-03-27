import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Award, BarChart3 } from "lucide-react";
import { formatDate, formatPercentage } from "@/lib/utils";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tStats = await getTranslations("admin.stats");

  const supabase = await createClient();

  // Fetch all stats in parallel
  const [
    studentsRes,
    enrollmentsRes,
    completedEnrollmentsRes,
    certificatesRes,
    examScoresRes,
    recentEnrollmentsRes,
    recentQuizzesRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .not("completed_at", "is", null),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true }),
    supabase.from("exam_attempts").select("percentage") as any,
    supabase
      .from("enrollments")
      .select("id, enrolled_at, user_id, course_id, profiles(full_name, email), courses(title_pt, title_en)")
      .order("enrolled_at", { ascending: false })
      .limit(5) as any,
    supabase
      .from("quiz_attempts")
      .select("id, score, total_questions, completed_at, user_id, module_id, profiles(full_name), modules(title_pt, title_en)")
      .order("completed_at", { ascending: false })
      .limit(5) as any,
  ]);

  const totalStudents = studentsRes.count ?? 0;
  const totalEnrollments = enrollmentsRes.count ?? 0;
  const completedEnrollments = completedEnrollmentsRes.count ?? 0;
  const certificatesIssued = certificatesRes.count ?? 0;
  const completionRate =
    totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

  const examScores = (examScoresRes.data ?? []) as Array<{ percentage: number }>;
  const averageExamScore =
    examScores.length > 0
      ? examScores.reduce((sum, e) => sum + e.percentage, 0) / examScores.length
      : 0;

  const recentEnrollments = (recentEnrollmentsRes.data ?? []) as Array<{
    id: string;
    enrolled_at: string;
    user_id: string;
    course_id: string;
    profiles: { full_name: string; email: string } | null;
    courses: { title_pt: string; title_en: string } | null;
  }>;

  const recentQuizzes = (recentQuizzesRes.data ?? []) as Array<{
    id: string;
    score: number;
    total_questions: number;
    completed_at: string;
    user_id: string;
    module_id: string;
    profiles: { full_name: string } | null;
    modules: { title_pt: string; title_en: string } | null;
  }>;

  const stats = [
    {
      label: tStats("totalStudents"),
      value: totalStudents,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: tStats("enrollments"),
      value: totalEnrollments,
      icon: BookOpen,
      color: "bg-emerald-500",
    },
    {
      label: tStats("completionRate"),
      value: formatPercentage(completionRate),
      icon: BarChart3,
      color: "bg-amber-500",
    },
    {
      label: tStats("certificatesIssued"),
      value: certificatesIssued,
      icon: Award,
      color: "bg-crimson-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-merriweather text-3xl font-bold tracking-tight">
          {t("dashboard")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("overview")}</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">
                {stat.label}
              </CardDescription>
              <div
                className={`${stat.color} flex h-9 w-9 items-center justify-center rounded-md text-white`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Average exam score bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tStats("averageScore")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(averageExamScore, 100)}%` }}
              />
            </div>
            <span className="min-w-[3rem] text-right text-sm font-semibold">
              {formatPercentage(averageExamScore)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tStats("enrollments")}</CardTitle>
            <CardDescription>
              {recentEnrollments.length > 0
                ? `${recentEnrollments.length} most recent`
                : "No enrollments yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEnrollments.map((enrollment) => {
                const courseTitle =
                  locale === "en"
                    ? enrollment.courses?.title_en
                    : enrollment.courses?.title_pt;
                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {enrollment.profiles?.full_name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {courseTitle}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {formatDate(enrollment.enrolled_at, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent quiz completions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {tStats("quizPerformance")}
            </CardTitle>
            <CardDescription>
              {recentQuizzes.length > 0
                ? `${recentQuizzes.length} most recent`
                : "No quizzes completed yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes.map((quiz) => {
                const moduleTitle =
                  locale === "en"
                    ? quiz.modules?.title_en
                    : quiz.modules?.title_pt;
                const scorePercent =
                  quiz.total_questions > 0
                    ? (quiz.score / quiz.total_questions) * 100
                    : 0;
                return (
                  <div key={quiz.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {quiz.profiles?.full_name ?? "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {moduleTitle}
                        </p>
                      </div>
                      <Badge
                        variant={scorePercent >= 70 ? "success" : "destructive"}
                        className="ml-3 shrink-0"
                      >
                        {formatPercentage(scorePercent)}
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all ${
                          scorePercent >= 70 ? "bg-success" : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(scorePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
