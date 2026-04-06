import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n/routing";
import { Plus, Pencil, Eye, BookOpen, Users } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import { Breadcrumb } from "@/components/admin/breadcrumb";

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");

  const supabase = await createAdminClient();

  // Get courses with module counts and enrollment counts
  const { data: courses } = await supabase
    .from("courses")
    .select("*, modules(id), enrollments(id)")
    .order("created_at", { ascending: false }) as { data: Array<{
      id: string;
      title_pt: string;
      title_en: string;
      description_pt: string;
      description_en: string;
      image_url: string | null;
      is_published: boolean;
      pass_threshold: number;
      created_at: string;
      updated_at: string;
      modules: { id: string }[];
      enrollments: { id: string }[];
    }> | null };

  const courseList = (courses ?? []).map((course) => ({
    ...course,
    modulesCount: Array.isArray(course.modules) ? course.modules.length : 0,
    enrolledCount: Array.isArray(course.enrollments)
      ? course.enrollments.length
      : 0,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Breadcrumb items={[{ label: t("courses") }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-merriweather text-3xl font-bold tracking-tight">
            {t("courses")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("manageContent")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            {tCommon("create")}
          </Link>
        </Button>
      </div>

      {courseList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{tCommon("noResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courseList.map((course, index) => {
            const title = getLocalizedField(course, "title", locale);
            const description = getLocalizedField(
              course,
              "description",
              locale
            );

            return (
              <Card
                key={course.id}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${index * 75}ms`, animationDuration: "300ms" }}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{title}</CardTitle>
                      <Badge
                        variant={course.is_published ? "success" : "secondary"}
                      >
                        {course.is_published
                          ? t("publishCourse").replace(
                              /publish|publicar/i,
                              ""
                            ).trim() || (locale === "en" ? "Published" : "Publicado")
                          : locale === "en"
                          ? "Draft"
                          : "Rascunho"}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        {tCommon("edit")}
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/courses/${course.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {course.modulesCount} {t("modules").toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>
                        {course.enrolledCount} {t("students").toLowerCase()}
                      </span>
                    </div>
                    <div className="text-xs">
                      {t("passThreshold")}: {course.pass_threshold}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
