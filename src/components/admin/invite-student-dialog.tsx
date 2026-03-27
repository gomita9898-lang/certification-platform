"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Plus, CheckCircle, Mail } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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
  const router = useRouter();

  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");

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

      if (data.message === "invited") {
        // New user — email sent
        setSentEmail(email.trim().toLowerCase());
      } else {
        // Existing user enrolled
        showToast(
          locale === "en"
            ? "Student enrolled successfully"
            : "Aluno inscrito com sucesso",
          "success"
        );
        handleClose();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : tCommon("error");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSentEmail(null);
    setFullName("");
    setEmail("");
    setCourseId("");
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("inviteStudent")}
      </Button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={sentEmail ? undefined : () => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
            {sentEmail ? (
              /* Email sent confirmation */
              <div className="space-y-5">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                    <Mail className="h-7 w-7 text-success" />
                  </div>
                  <h2 className="font-merriweather text-xl font-bold">
                    {locale === "en" ? "Invitation Sent!" : "Convite Enviado!"}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {locale === "en"
                      ? `An activation email has been sent to`
                      : `Um email de ativação foi enviado para`}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {sentEmail}
                  </p>
                </div>

                <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {locale === "en"
                      ? "The student will receive an email with a link to activate their account."
                      : "O aluno receberá um email com um link para ativar a sua conta."}
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {locale === "en"
                      ? "They will set their own password on first access."
                      : "O aluno definirá a sua própria palavra-passe no primeiro acesso."}
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {locale === "en"
                      ? "They are automatically enrolled in the selected course."
                      : "O aluno é automaticamente inscrito no curso selecionado."}
                  </p>
                </div>

                <Button className="w-full" onClick={handleClose}>
                  {locale === "en" ? "Done" : "Concluído"}
                </Button>
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
