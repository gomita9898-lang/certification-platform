import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="font-[family-name:var(--font-merriweather)] font-semibold text-primary">
            {t("appName")}
          </span>
        </div>
        <p>&copy; {new Date().getFullYear()} {t("appName")}</p>
      </div>
    </footer>
  );
}
