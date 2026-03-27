import { getTranslations } from "next-intl/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n/routing";
import { Users, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { InviteStudentDialog } from "@/components/admin/invite-student-dialog";

export default async function AdminStudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");

  const admin = await createAdminClient();

  // Get all students with their enrollment counts
  const { data: students } = await admin
    .from("profiles")
    .select(
      "id, full_name, email, created_at, enrollments(id, completed_at, enrolled_at)"
    )
    .eq("role", "student")
    .order("created_at", { ascending: false }) as { data: Array<{
      id: string;
      full_name: string;
      email: string;
      created_at: string;
      enrollments: { id: string; completed_at: string | null; enrolled_at: string }[];
    }> | null };

  const studentList = (students ?? []).map((student) => {
    const enrollments = Array.isArray(student.enrollments)
      ? student.enrollments
      : [];
    const completedCount = enrollments.filter(
      (e: { completed_at: string | null }) => e.completed_at !== null
    ).length;
    const lastEnrollment = enrollments.sort(
      (a: { enrolled_at: string }, b: { enrolled_at: string }) =>
        new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()
    )[0];

    return {
      ...student,
      enrolledCourses: enrollments.length,
      completedCourses: completedCount,
      lastActivity: lastEnrollment?.enrolled_at ?? student.created_at,
    };
  });

  // Fetch courses for invite dialog
  const { data: courses } = await admin
    .from("courses")
    .select("id, title_pt, title_en, is_published")
    .eq("is_published", true)
    .order("title_pt", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-merriweather text-3xl font-bold tracking-tight">
            {t("students")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {studentList.length} {t("students").toLowerCase()}
          </p>
        </div>
        <InviteStudentDialog courses={courses ?? []} locale={locale} />
      </div>

      {studentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{tCommon("noResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                    <th className="px-4 py-3">{t("studentName")}</th>
                    <th className="px-4 py-3">{t("studentEmail")}</th>
                    <th className="px-4 py-3 text-center">
                      {t("stats.enrollments")}
                    </th>
                    <th className="px-4 py-3 text-center">
                      {tCommon("status")}
                    </th>
                    <th className="px-4 py-3">{t("lastActivity")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b transition-colors last:border-0 hover:bg-accent/50"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.full_name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {student.enrolledCourses}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {student.completedCourses > 0 ? (
                          <Badge variant="success">{t("certified")}</Badge>
                        ) : student.enrolledCourses > 0 ? (
                          <Badge variant="default">
                            {locale === "en" ? "Active" : "Ativo"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {locale === "en" ? "Invited" : "Convidado"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(student.lastActivity, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
