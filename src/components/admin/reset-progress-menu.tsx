"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RotateCcw, ChevronRight, Trash2, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface ResetProgressMenuProps {
  studentId: string;
  courseId: string;
  courseTitle: string;
  modules: Module[];
}

type ResetType = "all" | "module" | "exam";

export function ResetProgressMenu({
  studentId,
  courseId,
  courseTitle,
  modules,
}: ResetProgressMenuProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetType, setResetType] = useState<ResetType>("all");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  function openConfirmation(type: ResetType, moduleId?: string, moduleTitle?: string) {
    setResetType(type);
    setSelectedModuleId(moduleId ?? null);
    setSelectedModuleTitle(moduleTitle ?? "");
    setDialogOpen(true);
  }

  function getDialogTitle(): string {
    switch (resetType) {
      case "all":
        return t("resetProgress.confirmResetAllTitle");
      case "module":
        return t("resetProgress.confirmResetModuleTitle");
      case "exam":
        return t("resetProgress.confirmResetExamTitle");
    }
  }

  function getDialogDescription(): string {
    switch (resetType) {
      case "all":
        return t("resetProgress.confirmResetAllDescription", { course: courseTitle });
      case "module":
        return t("resetProgress.confirmResetModuleDescription", { module: selectedModuleTitle });
      case "exam":
        return t("resetProgress.confirmResetExamDescription", { course: courseTitle });
    }
  }

  async function handleReset() {
    setIsLoading(true);
    try {
      const body: Record<string, string> = {
        studentId,
        courseId,
        type: resetType,
      };
      if (resetType === "module" && selectedModuleId) {
        body.moduleId = selectedModuleId;
      }

      const response = await fetch("/api/admin/reset-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Reset failed");
      }

      router.refresh();
    } catch (error) {
      console.error("Reset progress error:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {t("resetProgress.title")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => openConfirmation("all")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("resetProgress.resetAll")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <BookOpen className="mr-2 h-4 w-4" />
              {t("resetProgress.resetModule")}
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {modules
                .sort((a, b) => a.order_index - b.order_index)
                .map((mod) => (
                  <DropdownMenuItem
                    key={mod.id}
                    onSelect={() => openConfirmation("module", mod.id, mod.title)}
                  >
                    {mod.title}
                  </DropdownMenuItem>
                ))}
              {modules.length === 0 && (
                <DropdownMenuItem disabled>
                  {tCommon("noResults")}
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => openConfirmation("exam")}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t("resetProgress.resetExam")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getDialogTitle()}</AlertDialogTitle>
            <AlertDialogDescription>
              {getDialogDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? tCommon("loading") : tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
