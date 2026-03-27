import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, Link } from "@/lib/i18n/routing";
import { getLocalizedField, formatDate, formatPercentage } from "@/lib/utils";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, ChevronLeft, Award } from "lucide-react";

export default async function CertificateDetailPage({
  params,
}: {
  params: Promise<{ locale: string; certificateId: string }>;
}) {
  const { locale, certificateId } = await params;
  const t = await getTranslations("certificate");
  const tCommon = await getTranslations("common");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  // Fetch certificate
  const { data: certificate } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", certificateId)
    .eq("user_id", user.id)
    .single();

  if (!certificate) {
    redirect({ href: "/certificates", locale });
    return null;
  }

  // Fetch course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", certificate.course_id)
    .single();

  // Fetch student profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const courseTitle = course
    ? getLocalizedField(course, "title", locale)
    : "";
  const studentName = profile?.full_name ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8">
        <Link href="/certificates">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("myCertificates")}
        </Link>
      </Button>

      {/* Certificate Card */}
      <Card className="overflow-hidden border-2 border-primary/20">
        {/* Decorative header */}
        <div className="bg-primary px-8 py-6 text-center">
          <Award className="mx-auto mb-3 h-10 w-10 text-primary-foreground/80" />
          <h1 className="font-merriweather text-2xl font-bold tracking-wide text-primary-foreground">
            {t("certificateOf")}
          </h1>
        </div>

        <CardContent className="px-8 py-10 text-center">
          {/* Awarded to */}
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {t("awardedTo")}
          </p>
          <p className="mt-3 font-merriweather text-3xl font-bold text-primary">
            {studentName}
          </p>

          <Separator className="mx-auto my-8 max-w-xs" />

          {/* Course */}
          <p className="text-sm text-muted-foreground">
            {t("forCompletion")}
          </p>
          <p className="mt-3 font-merriweather text-xl font-semibold text-foreground">
            {courseTitle}
          </p>

          <Separator className="mx-auto my-8 max-w-xs" />

          {/* Details grid */}
          <div className="mx-auto grid max-w-md grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("score")}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {formatPercentage(certificate.score_percentage)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("issuedOn")}
              </p>
              <p className="mt-2 text-lg font-medium text-foreground">
                {formatDate(certificate.issued_at, locale)}
              </p>
            </div>
          </div>

          <Separator className="mx-auto my-8 max-w-xs" />

          {/* Certification Code */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("certificationId")}
            </p>
            <p className="mt-3 font-mono text-lg font-bold tracking-[0.2em] text-foreground">
              {certificate.certificate_code}
            </p>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-8 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            {tCommon("appName")}
          </p>
        </div>
      </Card>

      {/* Download Button */}
      <div className="mt-8 flex justify-center">
        <Button size="lg" asChild>
          <a
            href={`/api/certificates/${certificateId}/download`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="mr-2 h-5 w-5" />
            {t("download")}
          </a>
        </Button>
      </div>
    </div>
  );
}
