"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
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
import { Plus, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface ModuleFormData {
  title_pt: string;
  title_en: string;
  description_pt: string;
  description_en: string;
  content_pt: string;
  content_en: string;
  video_url: string;
  order_index: number;
  is_published: boolean;
}

interface OptionData {
  id?: string;
  text_pt: string;
  text_en: string;
  is_correct: boolean;
  order_index: number;
  _isNew?: boolean;
  _deleted?: boolean;
}

interface QuestionData {
  id?: string;
  question_pt: string;
  question_en: string;
  explanation_pt: string;
  explanation_en: string;
  order_index: number;
  options: OptionData[];
  _isNew?: boolean;
  _editing?: boolean;
}

export default function AdminModuleEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const locale = params.locale as string;

  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [moduleData, setModuleData] = useState<ModuleFormData>({
    title_pt: "",
    title_en: "",
    description_pt: "",
    description_en: "",
    content_pt: "",
    content_en: "",
    video_url: "",
    order_index: 1,
    is_published: false,
  });

  const [questions, setQuestions] = useState<QuestionData[]>([]);

  const supabase = createClient();

  const fetchModule = useCallback(async () => {
    const { data: mod } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (mod) {
      setModuleData({
        title_pt: mod.title_pt ?? "",
        title_en: mod.title_en ?? "",
        description_pt: mod.description_pt ?? "",
        description_en: mod.description_en ?? "",
        content_pt: mod.content_pt ?? "",
        content_en: mod.content_en ?? "",
        video_url: mod.video_url ?? "",
        order_index: mod.order_index ?? 1,
        is_published: mod.is_published ?? false,
      });
    }

    type OptionRow = Database["public"]["Tables"]["question_options"]["Row"];
    type QuestionRow = Database["public"]["Tables"]["questions"]["Row"] & {
      question_options: OptionRow[];
    };

    const { data: questionsData } = (await supabase
      .from("questions")
      .select("*, question_options(*)")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true })) as { data: QuestionRow[] | null };

    if (questionsData) {
      setQuestions(
        questionsData.map((q) => ({
          id: q.id,
          question_pt: q.question_pt ?? "",
          question_en: q.question_en ?? "",
          explanation_pt: q.explanation_pt ?? "",
          explanation_en: q.explanation_en ?? "",
          order_index: q.order_index ?? 0,
          options: (q.question_options ?? [])
            .sort((a, b) => a.order_index - b.order_index)
            .map((o) => ({
              id: o.id,
              text_pt: o.text_pt ?? "",
              text_en: o.text_en ?? "",
              is_correct: o.is_correct ?? false,
              order_index: o.order_index ?? 0,
            })),
          _editing: false,
        }))
      );
    }

    setLoading(false);
  }, [moduleId, supabase]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveModule = async (publish?: boolean) => {
    if (!moduleData.title_pt || !moduleData.title_en) return;

    setSaving(true);
    try {
      const dataToSave = {
        ...moduleData,
        is_published: publish !== undefined ? publish : moduleData.is_published,
      };

      const response = await fetch("/api/admin/save-module", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, data: dataToSave }),
      });

      if (!response.ok) throw new Error("Failed to save");

      if (publish !== undefined) {
        setModuleData((prev) => ({ ...prev, is_published: publish }));
      }

      showToast(
        publish ? t("moduleActivated") : t("savedSuccessfully"),
        "success",
      );
    } catch {
      showToast(tCommon("error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const nextOrder =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.order_index)) + 1
        : 1;

    setQuestions((prev) => [
      ...prev,
      {
        question_pt: "",
        question_en: "",
        explanation_pt: "",
        explanation_en: "",
        order_index: nextOrder,
        options: [
          { text_pt: "", text_en: "", is_correct: true, order_index: 1, _isNew: true },
          { text_pt: "", text_en: "", is_correct: false, order_index: 2, _isNew: true },
        ],
        _isNew: true,
        _editing: true,
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateOption = (
    qIndex: number,
    oIndex: number,
    field: string,
    value: string | boolean
  ) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      options[oIndex] = { ...options[oIndex], [field]: value };

      // If marking as correct, unmark others
      if (field === "is_correct" && value === true) {
        options.forEach((opt, i) => {
          if (i !== oIndex) opt.is_correct = false;
        });
      }

      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const nextOrder =
        updated[qIndex].options.length > 0
          ? Math.max(...updated[qIndex].options.map((o) => o.order_index)) + 1
          : 1;
      updated[qIndex] = {
        ...updated[qIndex],
        options: [
          ...updated[qIndex].options,
          {
            text_pt: "",
            text_en: "",
            is_correct: false,
            order_index: nextOrder,
            _isNew: true,
          },
        ],
      };
      return updated;
    });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const options = [...updated[qIndex].options];
      if (options[oIndex].id) {
        options[oIndex] = { ...options[oIndex], _deleted: true };
      } else {
        options.splice(oIndex, 1);
      }
      updated[qIndex] = { ...updated[qIndex], options };
      return updated;
    });
  };

  const handleSaveQuestion = async (index: number) => {
    const q = questions[index];
    if (!q.question_pt || !q.question_en) return;

    const activeOptions = q.options.filter((o) => !o._deleted);
    if (activeOptions.length < 2) return;
    if (!activeOptions.some((o) => o.is_correct)) return;

    try {
      const response = await fetch("/api/admin/save-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: {
            id: q.id,
            _isNew: q._isNew,
            question_pt: q.question_pt,
            question_en: q.question_en,
            explanation_pt: q.explanation_pt,
            explanation_en: q.explanation_en,
            order_index: q.order_index,
          },
          options: q.options,
          moduleId,
          courseId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save question");

      const { questionId } = await response.json();

      // Update local state
      setQuestions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          id: questionId,
          _isNew: false,
          _editing: false,
          options: updated[index].options.filter((o) => !o._deleted).map((o) => ({
            ...o,
            _isNew: false,
          })),
        };
        return updated;
      });

      // Also activate the module so question is visible to students
      if (!moduleData.is_published) {
        await handleSaveModule(true);
      }

      showToast(t("savedSuccessfully"), "success");
    } catch {
      showToast(tCommon("error"), "error");
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    if (!confirm(t("deleteConfirm"))) return;

    const q = questions[index];
    if (q.id) {
      await fetch("/api/admin/save-question", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: q.id }),
      });
    }

    setQuestions((prev) => prev.filter((_, i) => i !== index));
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
          {t("editModule")}
        </h1>
      </div>

      {/* Module form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("editModule")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title_pt">{t("titlePt")}</Label>
              <Input
                id="title_pt"
                value={moduleData.title_pt}
                onChange={(e) =>
                  setModuleData((prev) => ({ ...prev, title_pt: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_en">{t("titleEn")}</Label>
              <Input
                id="title_en"
                value={moduleData.title_en}
                onChange={(e) =>
                  setModuleData((prev) => ({ ...prev, title_en: e.target.value }))
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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={moduleData.description_pt}
                onChange={(e) =>
                  setModuleData((prev) => ({
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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={moduleData.description_en}
                onChange={(e) =>
                  setModuleData((prev) => ({
                    ...prev,
                    description_en: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("contentPt")}</Label>
              <RichTextEditor
                content={moduleData.content_pt}
                onChange={(html) =>
                  setModuleData((prev) => ({
                    ...prev,
                    content_pt: html,
                  }))
                }
                placeholder="Escreva o conteúdo do módulo aqui..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t("contentEn")}</Label>
              <RichTextEditor
                content={moduleData.content_en}
                onChange={(html) =>
                  setModuleData((prev) => ({
                    ...prev,
                    content_en: html,
                  }))
                }
                placeholder="Write the module content here..."
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="video_url">{t("videoUrl")}</Label>
              <Input
                id="video_url"
                value={moduleData.video_url}
                onChange={(e) =>
                  setModuleData((prev) => ({
                    ...prev,
                    video_url: e.target.value,
                  }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_index">{t("orderIndex")}</Label>
              <Input
                id="order_index"
                type="number"
                min={1}
                value={moduleData.order_index}
                onChange={(e) =>
                  setModuleData((prev) => ({
                    ...prev,
                    order_index: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  setModuleData((prev) => ({
                    ...prev,
                    is_published: !prev.is_published,
                  }))
                }
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                {moduleData.is_published ? (
                  <>
                    <Eye className="h-4 w-4 text-success" />
                    <Badge variant="success">
                      {locale === "en" ? "Published" : "Publicado"}
                    </Badge>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {locale === "en" ? "Draft" : "Rascunho"}
                    </Badge>
                  </>
                )}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={() => handleSaveModule()} disabled={saving}>
            {saving ? tCommon("loading") : tCommon("save")}
          </Button>
          {!moduleData.is_published ? (
            <Button
              variant="default"
              className="bg-success hover:bg-success/90"
              onClick={() => handleSaveModule(true)}
              disabled={saving}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {locale === "en" ? "Save & Activate" : "Guardar e Ativar"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleSaveModule(false)}
              disabled={saving}
            >
              <EyeOff className="mr-1.5 h-4 w-4" />
              {locale === "en" ? "Deactivate" : "Desativar"}
            </Button>
          )}
          <Button
            variant="outline"
            asChild
          >
            <a
              href={`/${locale}/admin/preview/courses/${courseId}/modules/${moduleId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              {t("previewAsStudent")}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </CardFooter>
      </Card>

      {/* Questions section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("questions")}</CardTitle>
          <Button size="sm" onClick={handleAddQuestion}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("addQuestion")}
          </Button>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tCommon("noResults")}
            </p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id ?? `new-${qIdx}`}
                  className="rounded-md border p-4"
                >
                  {q._editing ? (
                    /* Editing mode */
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("questionPt")}</Label>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={q.question_pt}
                            onChange={(e) =>
                              updateQuestion(qIdx, "question_pt", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("questionEn")}</Label>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={q.question_en}
                            onChange={(e) =>
                              updateQuestion(qIdx, "question_en", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("explanationPt")}</Label>
                          <textarea
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={q.explanation_pt}
                            onChange={(e) =>
                              updateQuestion(
                                qIdx,
                                "explanation_pt",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("explanationEn")}</Label>
                          <textarea
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={q.explanation_en}
                            onChange={(e) =>
                              updateQuestion(
                                qIdx,
                                "explanation_en",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            {locale === "en" ? "Options" : "Opcoes"}
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIdx)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            {t("addOption")}
                          </Button>
                        </div>

                        {q.options
                          .filter((o) => !o._deleted)
                          .map((opt, oIdx) => {
                            const actualIdx = q.options.findIndex(
                              (o) =>
                                o === opt ||
                                (o.id && o.id === opt.id)
                            );
                            return (
                              <div
                                key={opt.id ?? `opt-${oIdx}`}
                                className="grid gap-3 rounded border p-3 md:grid-cols-[1fr_1fr_auto_auto]"
                              >
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    {t("optionPt")}
                                  </Label>
                                  <Input
                                    value={opt.text_pt}
                                    onChange={(e) =>
                                      updateOption(
                                        qIdx,
                                        actualIdx,
                                        "text_pt",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    {t("optionEn")}
                                  </Label>
                                  <Input
                                    value={opt.text_en}
                                    onChange={(e) =>
                                      updateOption(
                                        qIdx,
                                        actualIdx,
                                        "text_en",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOption(
                                        qIdx,
                                        actualIdx,
                                        "is_correct",
                                        true
                                      )
                                    }
                                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                      opt.is_correct
                                        ? "bg-success text-success-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                    }`}
                                  >
                                    {t("markCorrect")}
                                  </button>
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeOption(qIdx, actualIdx)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveQuestion(qIdx)}
                        >
                          {tCommon("save")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (q._isNew && !q.id) {
                              setQuestions((prev) =>
                                prev.filter((_, i) => i !== qIdx)
                              );
                            } else {
                              setQuestions((prev) => {
                                const updated = [...prev];
                                updated[qIdx] = {
                                  ...updated[qIdx],
                                  _editing: false,
                                };
                                return updated;
                              });
                            }
                          }}
                        >
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {locale === "en" ? q.question_en : q.question_pt}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {q.options.filter((o) => !o._deleted).length}{" "}
                          {locale === "en" ? "options" : "opcoes"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setQuestions((prev) => {
                              const updated = [...prev];
                              updated[qIdx] = {
                                ...updated[qIdx],
                                _editing: true,
                              };
                              return updated;
                            })
                          }
                        >
                          {tCommon("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(qIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
