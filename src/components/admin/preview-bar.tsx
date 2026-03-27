"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";

interface PreviewBarProps {
  backHref: string;
}

export function PreviewBar({ backHref }: PreviewBarProps) {
  const t = useTranslations("admin.preview");
  const router = useRouter();

  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b-2 border-amber-400 bg-amber-50 shadow-md dark:border-amber-600 dark:bg-amber-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("banner")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(backHref)}
            className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            {t("backToEditor")}
          </Button>
        </div>
      </div>
    </div>
  );
}
