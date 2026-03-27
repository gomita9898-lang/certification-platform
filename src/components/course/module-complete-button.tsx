"use client";

import { useState } from "react";
import { useRouter } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ModuleCompleteButtonProps {
  moduleId: string;
  courseId: string;
  label: string;
}

export function ModuleCompleteButton({
  moduleId,
  courseId,
  label,
}: ModuleCompleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("course");
  const { showToast } = useToast();

  async function handleComplete() {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Check if progress record exists
    const { data: existing } = await supabase
      .from("module_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("module_progress")
        .update({
          status: "completed" as const,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("module_progress").insert({
        user_id: user.id,
        module_id: moduleId,
        course_id: courseId,
        status: "completed" as const,
        completed_at: new Date().toISOString(),
      });
    }

    showToast(t("moduleCompleted"), "success");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button onClick={handleComplete} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
