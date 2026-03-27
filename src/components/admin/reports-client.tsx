"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  Filter,
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Award,
} from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { getLocalizedField } from "@/lib/utils";

// ---------- Types ----------

interface Course {
  id: string;
  title_pt: string;
  title_en: string;
  [key: string]: unknown;
}

interface EnrollmentRow {
  studentName: string;
  email: string;
  courseName: string;
  enrolledDate: string;
  status: "active" | "completed" | "certified";
  completionDate: string | null;
}

interface ModuleCompletionRow {
  studentName: string;
  courseName: string;
  moduleName: string;
  status: string;
  bestQuizScore: number | null;
  completedDate: string | null;
}

interface QuizPerformanceRow {
  studentName: string;
  courseName: string;
  moduleName: string;
  attempts: number;
  bestScore: number;
  averageScore: number;
  lastAttemptDate: string;
}

interface ExamResultRow {
  studentName: string;
  courseName: string;
  score: number;
  passed: boolean;
  attempts: number;
  date: string;
}

interface CertificateRow {
  studentName: string;
  courseName: string;
  certificateCode: string;
  score: number;
  issueDate: string;
}

interface ReportsClientProps {
  courses: Course[];
  enrollments: EnrollmentRow[];
  moduleCompletions: ModuleCompletionRow[];
  quizPerformance: QuizPerformanceRow[];
  examResults: ExamResultRow[];
  certificates: CertificateRow[];
  locale: string;
}

// ---------- Tab Definition ----------

type TabKey =
  | "enrollments"
  | "moduleCompletion"
  | "quizPerformance"
  | "examResults"
  | "certificates";

const tabIcons: Record<TabKey, React.ReactNode> = {
  enrollments: <Users className="h-4 w-4" />,
  moduleCompletion: <BookOpen className="h-4 w-4" />,
  quizPerformance: <BarChart3 className="h-4 w-4" />,
  examResults: <GraduationCap className="h-4 w-4" />,
  certificates: <Award className="h-4 w-4" />,
};

// ---------- Helpers ----------

function formatDateLocal(date: string | null, locale: string): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function filterByDateRange<T>(
  data: T[],
  dateField: keyof T,
  from: string,
  to: string,
): T[] {
  let filtered = data;
  if (from) {
    const fromDate = new Date(from);
    filtered = filtered.filter((row) => {
      const val = row[dateField];
      return val ? new Date(val as string) >= fromDate : true;
    });
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((row) => {
      const val = row[dateField];
      return val ? new Date(val as string) <= toDate : true;
    });
  }
  return filtered;
}

function filterByCourse<T extends { courseName: string }>(
  data: T[],
  courseName: string,
): T[] {
  if (!courseName) return data;
  return data.filter((row) => row.courseName === courseName);
}

// ---------- Component ----------

export function ReportsClient({
  courses,
  enrollments,
  moduleCompletions,
  quizPerformance,
  examResults,
  certificates,
  locale,
}: ReportsClientProps) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<TabKey>("enrollments");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Course names for the dropdown
  const courseNames = useMemo(() => {
    return courses.map((c) => getLocalizedField(c, "title", locale));
  }, [courses, locale]);

  // ---------- Filtered Data ----------

  const filteredEnrollments = useMemo(() => {
    let data = enrollments;
    data = filterByCourse(data, selectedCourse);
    data = filterByDateRange(data, "enrolledDate", dateFrom, dateTo);
    return data;
  }, [enrollments, selectedCourse, dateFrom, dateTo]);

  const filteredModuleCompletions = useMemo(() => {
    let data = moduleCompletions;
    data = filterByCourse(data, selectedCourse);
    data = filterByDateRange(data, "completedDate", dateFrom, dateTo);
    return data;
  }, [moduleCompletions, selectedCourse, dateFrom, dateTo]);

  const filteredQuizPerformance = useMemo(() => {
    let data = quizPerformance;
    data = filterByCourse(data, selectedCourse);
    data = filterByDateRange(data, "lastAttemptDate", dateFrom, dateTo);
    return data;
  }, [quizPerformance, selectedCourse, dateFrom, dateTo]);

  const filteredExamResults = useMemo(() => {
    let data = examResults;
    data = filterByCourse(data, selectedCourse);
    data = filterByDateRange(data, "date", dateFrom, dateTo);
    return data;
  }, [examResults, selectedCourse, dateFrom, dateTo]);

  const filteredCertificates = useMemo(() => {
    let data = certificates;
    data = filterByCourse(data, selectedCourse);
    data = filterByDateRange(data, "issueDate", dateFrom, dateTo);
    return data;
  }, [certificates, selectedCourse, dateFrom, dateTo]);

  // ---------- Export Handlers ----------

  const handleExport = () => {
    switch (activeTab) {
      case "enrollments":
        exportToExcel(
          filteredEnrollments as unknown as Record<string, unknown>[],
          enrollmentColumns,
          "enrollment-report",
        );
        break;
      case "moduleCompletion":
        exportToExcel(
          filteredModuleCompletions as unknown as Record<string, unknown>[],
          moduleCompletionColumns,
          "module-completion-report",
        );
        break;
      case "quizPerformance":
        exportToExcel(
          filteredQuizPerformance as unknown as Record<string, unknown>[],
          quizPerformanceColumns,
          "quiz-performance-report",
        );
        break;
      case "examResults":
        exportToExcel(
          filteredExamResults.map((r) => ({
            ...r,
            passed: r.passed ? tCommon("yes") : tCommon("no"),
          })) as unknown as Record<string, unknown>[],
          examResultColumns,
          "exam-results-report",
        );
        break;
      case "certificates":
        exportToExcel(
          filteredCertificates as unknown as Record<string, unknown>[],
          certificateColumns,
          "certificate-report",
        );
        break;
    }
  };

  // ---------- Column Definitions ----------

  const enrollmentColumns: ExportColumn[] = [
    { header: t("studentName"), key: "studentName" },
    { header: t("email"), key: "email" },
    { header: t("course"), key: "courseName" },
    { header: t("enrolledDate"), key: "enrolledDate" },
    { header: tCommon("status"), key: "status" },
    { header: t("completionDate"), key: "completionDate" },
  ];

  const moduleCompletionColumns: ExportColumn[] = [
    { header: t("studentName"), key: "studentName" },
    { header: t("course"), key: "courseName" },
    { header: t("module"), key: "moduleName" },
    { header: tCommon("status"), key: "status" },
    { header: t("bestQuizScore"), key: "bestQuizScore" },
    { header: t("completedDate"), key: "completedDate" },
  ];

  const quizPerformanceColumns: ExportColumn[] = [
    { header: t("studentName"), key: "studentName" },
    { header: t("course"), key: "courseName" },
    { header: t("module"), key: "moduleName" },
    { header: t("attempts"), key: "attempts" },
    { header: t("bestScore"), key: "bestScore" },
    { header: t("averageScore"), key: "averageScore" },
    { header: t("lastAttemptDate"), key: "lastAttemptDate" },
  ];

  const examResultColumns: ExportColumn[] = [
    { header: t("studentName"), key: "studentName" },
    { header: t("course"), key: "courseName" },
    { header: t("score"), key: "score" },
    { header: t("passed"), key: "passed" },
    { header: t("attempts"), key: "attempts" },
    { header: t("date"), key: "date" },
  ];

  const certificateColumns: ExportColumn[] = [
    { header: t("studentName"), key: "studentName" },
    { header: t("course"), key: "courseName" },
    { header: t("certificateCode"), key: "certificateCode" },
    { header: t("score"), key: "score" },
    { header: t("issueDate"), key: "issueDate" },
  ];

  // ---------- Tab Labels ----------

  const tabLabels: Record<TabKey, string> = {
    enrollments: t("enrollmentReport"),
    moduleCompletion: t("moduleCompletionReport"),
    quizPerformance: t("quizPerformanceReport"),
    examResults: t("examResults"),
    certificates: t("certificateReport"),
  };

  const tabs: TabKey[] = [
    "enrollments",
    "moduleCompletion",
    "quizPerformance",
    "examResults",
    "certificates",
  ];

  // ---------- Status Badge ----------

  function renderStatusBadge(status: string) {
    switch (status) {
      case "certified":
        return <Badge variant="success">{t("statusCertified")}</Badge>;
      case "completed":
        return <Badge variant="default">{t("statusCompleted")}</Badge>;
      case "active":
        return <Badge variant="secondary">{t("statusActive")}</Badge>;
      case "in_progress":
        return <Badge variant="secondary">{t("statusInProgress")}</Badge>;
      case "not_started":
        return <Badge variant="outline">{t("statusNotStarted")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // ---------- Table Renderers ----------

  function renderEnrollmentsTable() {
    if (filteredEnrollments.length === 0) {
      return <p className="py-8 text-center text-muted-foreground">{tCommon("noResults")}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
              <th className="px-4 py-3">{t("studentName")}</th>
              <th className="px-4 py-3">{t("email")}</th>
              <th className="px-4 py-3">{t("course")}</th>
              <th className="px-4 py-3">{t("enrolledDate")}</th>
              <th className="px-4 py-3">{tCommon("status")}</th>
              <th className="px-4 py-3">{t("completionDate")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.map((row, i) => (
              <tr key={i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{row.studentName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.email}</td>
                <td className="px-4 py-3 text-sm">{row.courseName}</td>
                <td className="px-4 py-3 text-sm">{formatDateLocal(row.enrolledDate, locale)}</td>
                <td className="px-4 py-3">{renderStatusBadge(row.status)}</td>
                <td className="px-4 py-3 text-sm">
                  {formatDateLocal(row.completionDate, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderModuleCompletionTable() {
    if (filteredModuleCompletions.length === 0) {
      return <p className="py-8 text-center text-muted-foreground">{tCommon("noResults")}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
              <th className="px-4 py-3">{t("studentName")}</th>
              <th className="px-4 py-3">{t("course")}</th>
              <th className="px-4 py-3">{t("module")}</th>
              <th className="px-4 py-3">{tCommon("status")}</th>
              <th className="px-4 py-3">{t("bestQuizScore")}</th>
              <th className="px-4 py-3">{t("completedDate")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredModuleCompletions.map((row, i) => (
              <tr key={i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{row.studentName}</td>
                <td className="px-4 py-3 text-sm">{row.courseName}</td>
                <td className="px-4 py-3 text-sm">{row.moduleName}</td>
                <td className="px-4 py-3">{renderStatusBadge(row.status)}</td>
                <td className="px-4 py-3 text-sm">
                  {row.bestQuizScore !== null ? `${row.bestQuizScore}%` : "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {formatDateLocal(row.completedDate, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderQuizPerformanceTable() {
    if (filteredQuizPerformance.length === 0) {
      return <p className="py-8 text-center text-muted-foreground">{tCommon("noResults")}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
              <th className="px-4 py-3">{t("studentName")}</th>
              <th className="px-4 py-3">{t("course")}</th>
              <th className="px-4 py-3">{t("module")}</th>
              <th className="px-4 py-3 text-center">{t("attempts")}</th>
              <th className="px-4 py-3 text-center">{t("bestScore")}</th>
              <th className="px-4 py-3 text-center">{t("averageScore")}</th>
              <th className="px-4 py-3">{t("lastAttemptDate")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizPerformance.map((row, i) => (
              <tr key={i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{row.studentName}</td>
                <td className="px-4 py-3 text-sm">{row.courseName}</td>
                <td className="px-4 py-3 text-sm">{row.moduleName}</td>
                <td className="px-4 py-3 text-center text-sm">{row.attempts}</td>
                <td className="px-4 py-3 text-center text-sm">{row.bestScore}%</td>
                <td className="px-4 py-3 text-center text-sm">{row.averageScore}%</td>
                <td className="px-4 py-3 text-sm">
                  {formatDateLocal(row.lastAttemptDate, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderExamResultsTable() {
    if (filteredExamResults.length === 0) {
      return <p className="py-8 text-center text-muted-foreground">{tCommon("noResults")}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
              <th className="px-4 py-3">{t("studentName")}</th>
              <th className="px-4 py-3">{t("course")}</th>
              <th className="px-4 py-3 text-center">{t("score")}</th>
              <th className="px-4 py-3 text-center">{t("passed")}</th>
              <th className="px-4 py-3 text-center">{t("attempts")}</th>
              <th className="px-4 py-3">{t("date")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredExamResults.map((row, i) => (
              <tr key={i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{row.studentName}</td>
                <td className="px-4 py-3 text-sm">{row.courseName}</td>
                <td className="px-4 py-3 text-center text-sm">{row.score}%</td>
                <td className="px-4 py-3 text-center">
                  {row.passed ? (
                    <Badge variant="success">{tCommon("yes")}</Badge>
                  ) : (
                    <Badge variant="destructive">{tCommon("no")}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-sm">{row.attempts}</td>
                <td className="px-4 py-3 text-sm">{formatDateLocal(row.date, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderCertificatesTable() {
    if (filteredCertificates.length === 0) {
      return <p className="py-8 text-center text-muted-foreground">{tCommon("noResults")}</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
              <th className="px-4 py-3">{t("studentName")}</th>
              <th className="px-4 py-3">{t("course")}</th>
              <th className="px-4 py-3">{t("certificateCode")}</th>
              <th className="px-4 py-3 text-center">{t("score")}</th>
              <th className="px-4 py-3">{t("issueDate")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.map((row, i) => (
              <tr key={i} className="border-b transition-colors last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{row.studentName}</td>
                <td className="px-4 py-3 text-sm">{row.courseName}</td>
                <td className="px-4 py-3 text-sm font-mono">{row.certificateCode}</td>
                <td className="px-4 py-3 text-center text-sm">{row.score}%</td>
                <td className="px-4 py-3 text-sm">{formatDateLocal(row.issueDate, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const tableRenderers: Record<TabKey, () => React.ReactNode> = {
    enrollments: renderEnrollmentsTable,
    moduleCompletion: renderModuleCompletionTable,
    quizPerformance: renderQuizPerformanceTable,
    examResults: renderExamResultsTable,
    certificates: renderCertificatesTable,
  };

  // ---------- Record Counts ----------

  const recordCounts: Record<TabKey, number> = {
    enrollments: filteredEnrollments.length,
    moduleCompletion: filteredModuleCompletions.length,
    quizPerformance: filteredQuizPerformance.length,
    examResults: filteredExamResults.length,
    certificates: filteredCertificates.length,
  };

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            {t("filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-64">
              <Label htmlFor="course-filter">{t("course")}</Label>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("allCourses")}</option>
                {courseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="date-from">{t("dateFrom")}</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="date-to">{t("dateTo")}</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            {(selectedCourse || dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCourse("");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-primary bg-background text-primary"
                : "text-muted-foreground hover:bg-accent/50 hover:text-primary"
            }`}
          >
            {tabIcons[tab]}
            <span className="hidden sm:inline">{tabLabels[tab]}</span>
          </button>
        ))}
      </div>

      {/* Active Report Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">{tabLabels[activeTab]}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {recordCounts[activeTab]} {t("records")}
            </p>
          </div>
          <Button onClick={handleExport} className="gap-2" disabled={recordCounts[activeTab] === 0}>
            <Download className="h-4 w-4" />
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">{t("exportExcel")}</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">{tableRenderers[activeTab]()}</CardContent>
      </Card>
    </div>
  );
}
