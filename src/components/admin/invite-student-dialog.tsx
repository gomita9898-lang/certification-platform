"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Plus, Copy, CheckCircle } from "lucide-react";
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

interface Credentials {
  email: string;
  password: string;
}

export function InviteStudentDialog({
  courses,
  locale,
}: InviteStudentDialogProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

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

      if (data.credentials) {
        // New user created — show credentials
        setCredentials(data.credentials);
      } else {
        // Existing user enrolled
        showToast(
          locale === "en"
            ? "Student enrolled successfully"
            : "Aluno inscrito com sucesso",
          "success"
        );
        handleClose();
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : tCommon("error");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setCredentials(null);
    setFullName("");
    setEmail("");
    setCourseId("");
    setCopied(false);
    router.refresh();
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
            onClick={credentials ? undefined : () => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            {credentials ? (
              /* Credentials screen */
              <div className="space-y-5">
                <div className="text-center">
                  <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success" />
                  <h2 className="font-merriweather text-xl font-bold">
                    {locale === "en" ? "Student Created!" : "Aluno Criado!"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {locale === "en"
                      ? "Share these credentials with the student so they can log in."
                      : "Partilhe estas credenciais com o aluno para que possa iniciar sessão."}
                  </p>
                </div>

                <div className="rounded-md border bg-muted/50 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1 font-mono text-sm font-medium">
                      {credentials.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {locale === "en" ? "Password" : "Palavra-passe"}
                    </p>
                    <p className="mt-1 font-mono text-sm font-medium">
                      {credentials.password}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyCredentials}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-success" />
                        {locale === "en" ? "Copied!" : "Copiado!"}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {locale === "en" ? "Copy credentials" : "Copiar credenciais"}
                      </>
                    )}
                  </Button>
                  <Button className="flex-1" onClick={handleClose}>
                    {locale === "en" ? "Done" : "Concluído"}
                  </Button>
                </div>
              </div>
            ) : (
              /* Invite form */
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
