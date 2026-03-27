"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/i18n/routing";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  BookOpen,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";

interface CourseData {
  id: string;
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
  is_published: boolean;
  pass_threshold: number;
  image_url: string | null;
}

interface ModuleData {
  id: string;
  title_pt: string;
  title_en: string;
  order_index: number;
  is_published: boolean;
  question_count: number;
}

export default function AdminCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const locale = params.locale as string;
  const isNew = courseId === "new";

  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [course, setCourse] = useState<CourseData>({
    id: "",
    title_pt: "",
    title_en: "",
    description_pt: "",
    description_en: "",
    is_published: false,
    pass_threshold: 70,
    image_url: null,
  });
  const [modules, setModules] = useState<ModuleData[]>([]);

  const supabase = createClient();

  const fetchCourse = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }

    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseData) {
      setCourse(courseData);
    }

    const { data: modulesData } = await supabase
      .from("modules")
      .select("id, title_pt, title_en, order_index, is_published, questions(id)")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true }) as { data: Array<{
        id: string;
        title_pt: string;
        title_en: string;
        order_index: number;
        is_published: boolean;
        questions: { id: string }[];
      }> | null };

    if (modulesData) {
      setModules(
        modulesData.map((m) => ({
          id: m.id,
          title_pt: m.title_pt,
          title_en: m.title_en,
          order_index: m.order_index,
          is_published: m.is_published,
          question_count: Array.isArray(m.questions) ? m.questions.length : 0,
        }))
      );
    }

    setLoading(false);
  }, [courseId, isNew, supabase]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!course.title_pt || !course.title_en) return;

    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("courses")
          .insert({
            title_pt: course.title_pt,
            title_en: course.title_en,
            description_pt: course.description_pt,
            description_en: course.description_en,
            is_published: course.is_published,
            pass_threshold: course.pass_threshold,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCourse(data);
          window.history.replaceState(null, "", `/${locale}/admin/courses/${data.id}`);
        }
      } else {
        const { error } = await supabase
          .from("courses")
          .update({
            title_pt: course.title_pt,
            title_en: course.title_en,
            description_pt: course.description_pt,
            description_en: course.description_en,
            is_published: course.is_published,
            pass_threshold: course.pass_threshold,
          })
          .eq("id", courseId);

        if (error) throw error;
      }
      showToast(t("savedSuccessfully"), "success");
    } catch {
      showToast(tCommon("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (isNew || !course.id) return;

    const nextOrder = modules.length > 0
      ? Math.max(...modules.map((m) => m.order_index)) + 1
      : 1;

    const { data, error } = await supabase
      .from("modules")
      .insert({
        course_id: course.id || courseId,
        title_pt: "Novo Modulo",
        title_en: "New Module",
        description_pt: "",
        description_en: "",
        content_pt: "",
        content_en: "",
        order_index: nextOrder,
        is_published: false,
      })
      .select()
      .single();

    if (!error && data) {
      setModules((prev) => [
        ...prev,
        {
          id: data.id,
          title_pt: data.title_pt,
          title_en: data.title_en,
          order_index: data.order_index,
          is_published: data.is_published,
          question_count: 0,
        },
      ]);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (!error) {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
  };

  const handleMoveModule = async (moduleId: string, direction: "up" | "down") => {
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === modules.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...modules];
    const tempOrder = updated[idx].order_index;
    updated[idx].order_index = updated[swapIdx].order_index;
    updated[swapIdx].order_index = tempOrder;

    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setModules(updated);

    // Persist order changes
    await Promise.all([
      supabase
        .from("modules")
        .update({ order_index: updated[idx].order_index })
        .eq("id", updated[idx].id),
      supabase
        .from("modules")
        .update({ order_index: updated[swapIdx].order_index })
        .eq("id", updated[swapIdx].id),
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
            toast.type === "success" ? "bg-success" : "bg-destructive"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="font-merriweather text-3xl font-bold tracking-tight">
          {isNew ? tCommon("create") : t("courseSettings")}
        </h1>
      </div>

      {/* Course form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("courseSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title_pt">{t("titlePt")}</Label>
              <Input
                id="title_pt"
                value={course.title_pt}
                onChange={(e) =>
                  setCourse((prev) => ({ ...prev, title_pt: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_en">{t("titleEn")}</Label>
              <Input
                id="title_en"
                value={course.title_en}
                onChange={(e) =>
                  setCourse((prev) => ({ ...prev, title_en: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description_pt">{t("descriptionPt")}</Label>
              <textarea
                id="description_pt"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={course.description_pt}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    description_pt: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_en">{t("descriptionEn")}</Label>
              <textarea
                id="description_en"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={course.description_en}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    description_en: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pass_threshold">{t("passThreshold")}</Label>
              <Input
                id="pass_threshold"
                type="number"
                min={0}
                max={100}
                value={course.pass_threshold}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    pass_threshold: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-end space-x-3">
              <button
                type="button"
                onClick={() =>
                  setCourse((prev) => ({
                    ...prev,
                    is_published: !prev.is_published,
                  }))
                }
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                {course.is_published ? (
                  <>
                    <Eye className="h-4 w-4 text-success" />
                    {t("publishCourse")}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    {t("unpublishCourse")}
                  </>
                )}
              </button>
              <Badge variant={course.is_published ? "success" : "secondary"}>
                {course.is_published
                  ? locale === "en"
                    ? "Published"
                    : "Publicado"
                  : locale === "en"
                  ? "Draft"
                  : "Rascunho"}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? tCommon("loading") : tCommon("save")}
          </Button>
          {!isNew && (
            <Button variant="outline" asChild>
              <a
                href={`/${locale}/admin/preview/courses/${courseId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {t("previewAsStudent")}
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Modules section */}
      {!isNew && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("modules")}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/courses/${courseId}/import-questions`}>
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                  {t("import.importQuestions")}
                </Link>
              </Button>
              <Button size="sm" onClick={handleAddModule}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("addModule")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tCommon("noResults")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((mod, idx) => {
                  const title =
                    locale === "en" ? mod.title_en : mod.title_pt;
                  return (
                    <div
                      key={mod.id}
                      className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveModule(mod.id, "up")}
                          disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <GripVertical className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleMoveModule(mod.id, "down")}
                          disabled={idx === modules.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <GripVertical className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {mod.order_index}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {mod.question_count} {t("questions").toLowerCase()}
                        </p>
                      </div>

                      <Badge
                        variant={mod.is_published ? "success" : "secondary"}
                        className="shrink-0"
                      >
                        {mod.is_published
                          ? locale === "en"
                            ? "Published"
                            : "Publicado"
                          : locale === "en"
                          ? "Draft"
                          : "Rascunho"}
                      </Badge>

                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/admin/courses/${courseId}/modules/${mod.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteModule(mod.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
