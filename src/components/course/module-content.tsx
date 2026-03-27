"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

interface ModuleContentProps {
  moduleId: string;
  courseId: string;
  userId: string;
  videoEmbedUrl: string | null;
  contentHtml: string;
  locale: string;
}

export function ModuleContent({
  moduleId,
  courseId,
  userId,
  videoEmbedUrl,
  contentHtml,
  locale,
}: ModuleContentProps) {
  const t = useTranslations("course");

  useEffect(() => {
    async function markInProgress() {
      const supabase = createClient();

      // Check current status first
      const { data: existing } = await supabase
        .from("module_progress")
        .select("id, status")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .maybeSingle();

      // Only upsert if not already completed (don't downgrade completed to in_progress)
      if (existing?.status === "completed") return;

      if (existing) {
        await supabase
          .from("module_progress")
          .update({
            status: "in_progress" as const,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("module_progress").insert({
          user_id: userId,
          module_id: moduleId,
          course_id: courseId,
          status: "in_progress" as const,
        });
      }
    }

    markInProgress();
  }, [moduleId, courseId, userId]);

  return (
    <div className="space-y-10">
      {/* Video Section */}
      {videoEmbedUrl && (
        <section>
          <h2 className="mb-4 font-merriweather text-xl font-semibold">
            {t("video")}
          </h2>
          <div className="relative w-full overflow-hidden rounded-lg border bg-black" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={videoEmbedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={t("video")}
            />
          </div>
        </section>
      )}

      {/* Text Content Section */}
      {contentHtml && (
        <section>
          <h2 className="mb-4 font-merriweather text-xl font-semibold">
            {t("content")}
          </h2>
          <div
            className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-merriweather prose-headings:text-primary prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </section>
      )}
    </div>
  );
}
