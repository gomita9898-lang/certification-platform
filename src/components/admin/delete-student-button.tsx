"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface DeleteStudentButtonProps {
  studentId: string;
  studentName: string;
  locale: string;
}

export function DeleteStudentButton({
  studentId,
  studentName,
  locale,
}: DeleteStudentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    const confirmMsg = locale === "en"
      ? `Are you sure you want to delete "${studentName}"? This will remove their account, all progress, and certificates. This action cannot be undone.`
      : `Tem a certeza que pretende eliminar "${studentName}"? Isto removerá a conta, todo o progresso e certificados. Esta ação não pode ser desfeita.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-student", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || (locale === "en" ? "Failed to delete student" : "Erro ao eliminar aluno"), "error");
        return;
      }

      showToast(
        locale === "en" ? "Student deleted successfully" : "Aluno eliminado com sucesso",
        "success"
      );
      router.refresh();
    } catch {
      showToast(locale === "en" ? "Failed to delete student" : "Erro ao eliminar aluno", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={loading}
      title={locale === "en" ? "Delete student" : "Eliminar aluno"}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
