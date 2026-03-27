"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/lib/i18n/routing";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import type {
  ImportModule,
  ParsedQuestion,
  ParseResult,
} from "@/lib/question-import";
import {
  parseQuestionFile,
  generateQuestionTemplate,
} from "@/lib/question-import";
import { Breadcrumb } from "@/components/admin/breadcrumb";

export default function ImportQuestionsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const locale = params.locale as string;

  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [modules, setModules] = useState<ImportModule[]>([]);
  const [courseName, setCourseName] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: { index: number; error: string }[];
    total: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    // Fetch course name
    const { data: courseData } = await supabase
      .from("courses")
      .select("title_pt, title_en")
      .eq("id", courseId)
      .single();

    if (courseData) {
      setCourseName(locale === "en" ? courseData.title_en : courseData.title_pt);
    }

    // Fetch modules
    const { data: modulesData } = await supabase
      .from("modules")
      .select("id, title_pt, title_en")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });

    if (modulesData) {
      setModules(
        modulesData.map((m) => ({
          id: m.id,
          title_pt: m.title_pt ?? "",
          title_en: m.title_en ?? "",
        })),
      );
    }

    setLoading(false);
  }, [courseId, locale, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);

    try {
      const result = await parseQuestionFile(file, modules);
      setParseResult(result);
    } catch {
      showToast(tCommon("error"), "error");
      setSelectedFile(null);
      setParseResult(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    generateQuestionTemplate(modules);
  };

  const handleImport = async () => {
    if (!parseResult) return;

    const validQuestions = parseResult.questions.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      showToast(t("import.noValidQuestions"), "error");
      return;
    }

    if (
      !confirm(
        t("import.confirmImport", { count: validQuestions.length }),
      )
    ) {
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/admin/import-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          questions: validQuestions.map((q) => ({
            module_id: q.module_id,
            question_pt: q.question_pt,
            question_en: q.question_en,
            explanation_pt: q.explanation_pt,
            explanation_en: q.explanation_en,
            is_exam_question: q.is_exam_question,
            options: q.options,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || tCommon("error"), "error");
        return;
      }

      setImportResult(result);

      if (result.imported > 0) {
        showToast(
          t("import.importSuccess", { count: result.imported }),
          "success",
        );
      }

      if (result.errors?.length > 0) {
        showToast(
          t("import.importPartialErrors", { count: result.errors.length }),
          "error",
        );
      }
    } catch {
      showToast(tCommon("error"), "error");
    } finally {
      setImporting(false);
    }
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

      <Breadcrumb
        items={[
          { label: t("courses"), href: "/admin/courses" },
          { label: courseName || t("courses"), href: `/admin/courses/${courseId}` },
          { label: t("import.title") },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-merriweather text-3xl font-bold tracking-tight">
            {t("import.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{courseName}</p>
        </div>
      </div>

      {/* Template Download & File Upload */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Template Download Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              {t("import.downloadTemplate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("import.downloadTemplateDescription")}
            </p>
            {modules.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("import.availableModules")}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {modules.map((m) => (
                    <Badge key={m.id} variant="secondary" className="text-xs">
                      {locale === "en" ? m.title_en : m.title_pt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={modules.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t("import.downloadTemplateButton")}
            </Button>
          </CardFooter>
        </Card>

        {/* File Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              {t("import.uploadFile")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {t("import.uploadFileDescription")}
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <Button variant="ghost" size="icon" onClick={handleClearFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parse Results Preview */}
      {parseResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("import.preview")}</CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {t("import.totalRows", { count: parseResult.totalRows })}
              </Badge>
              <Badge variant="success">
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("import.validRows", { count: parseResult.validCount })}
              </Badge>
              {parseResult.errorCount > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {t("import.errorRows", { count: parseResult.errorCount })}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b text-left">
                    <th className="px-2 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">
                      {t("import.status")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("modules")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("questionPt")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("questionEn")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {locale === "en" ? "Options" : "Opcoes"}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("isExamQuestion")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("import.errors")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.questions.map((q: ParsedQuestion, idx: number) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        !q.isValid
                          ? "bg-destructive/5"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <td className="px-2 py-2 text-muted-foreground">
                        {q.rowNumber}
                      </td>
                      <td className="px-2 py-2">
                        {q.isValid ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="max-w-[150px] truncate px-2 py-2">
                        {q.module_title_pt}
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-2">
                        {q.question_pt}
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-2">
                        {q.question_en}
                      </td>
                      <td className="px-2 py-2">
                        {q.options.length}{" "}
                        {q.options.filter((o) => o.is_correct).length > 0 && (
                          <span className="text-success">
                            ({q.options.filter((o) => o.is_correct).length}{" "}
                            {locale === "en" ? "correct" : "correta(s)"})
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {q.is_exam_question ? (
                          <Badge variant="default" className="text-xs">
                            {locale === "en" ? "Exam" : "Exame"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="max-w-[250px] px-2 py-2">
                        {q.errors.length > 0 && (
                          <ul className="list-inside list-disc space-y-0.5">
                            {q.errors.map((error, eIdx) => (
                              <li
                                key={eIdx}
                                className="text-xs text-destructive"
                              >
                                {error}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("import.importNote")}
            </p>
            <Button
              onClick={handleImport}
              disabled={
                importing || parseResult.validCount === 0 || !!importResult
              }
            >
              {importing ? (
                tCommon("loading")
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("import.importButton", {
                    count: parseResult.validCount,
                  })}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-success" />
              {t("import.resultsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {importResult.total}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("import.totalProcessed")}
                </p>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p className="text-2xl font-bold text-success">
                  {importResult.imported}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("import.successfullyImported")}
                </p>
              </div>
              <div className="rounded-md border p-4 text-center">
                <p
                  className={`text-2xl font-bold ${
                    importResult.errors.length > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {importResult.errors.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("import.failedImports")}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="mb-2 text-sm font-medium text-destructive">
                  {t("import.importErrors")}:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx} className="text-xs text-destructive">
                      {t("import.rowError", {
                        row: err.index + 1,
                        error: err.error,
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/courses/${courseId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("import.backToCourse")}
                </Link>
              </Button>
              <Button variant="outline" onClick={handleClearFile}>
                <Upload className="mr-2 h-4 w-4" />
                {t("import.importAnother")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
