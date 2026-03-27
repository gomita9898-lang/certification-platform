"use client";

import { useTranslations } from "next-intl";

interface PreviewModuleContentProps {
  videoEmbedUrl: string | null;
  contentHtml: string;
}

export function PreviewModuleContent({
  videoEmbedUrl,
  contentHtml,
}: PreviewModuleContentProps) {
  const t = useTranslations("course");

  return (
    <div className="space-y-10">
      {/* Video Section */}
      {videoEmbedUrl && (
        <section>
          <h2 className="mb-4 font-merriweather text-xl font-semibold">
            {t("video")}
          </h2>
          <div
            className="relative w-full overflow-hidden rounded-lg border bg-black"
            style={{ paddingBottom: "56.25%" }}
          >
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
