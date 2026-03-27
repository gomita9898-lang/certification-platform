"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Plus } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";

interface Course {
  id: string;
  title_pt: string;
  title_en: string;
  is_published: boolean;
  [key: string]: unknown;
}

interface InviteStudentDialogProps {
  courses: Course[];
  locale: string;
}

export function InviteStudentDialog({
  courses,
  locale,
}: InviteStudentDialogProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !courseId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          course_id: courseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite student");
      }

      showToast(
        t("invitationSent", { email: email.trim() }),
        "success"
      );
      setFullName("");
      setEmail("");
      setCourseId("");
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : tCommon("error");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("inviteStudent")}
      </Button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            <h2 className="font-merriweather text-xl font-bold">
              {t("inviteStudentTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("inviteStudentSubtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">{t("studentName")}</Label>
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">{t("studentEmail")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-course">
                  {locale === "en" ? "Course" : "Curso"}
                </Label>
                <select
                  id="invite-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {locale === "en" ? "Select a course" : "Selecione um curso"}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {getLocalizedField(course, "title", locale)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    tCommon("loading")
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t("sendInvitation")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
