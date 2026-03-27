import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect, Link } from "@/lib/i18n/routing";
import { getLocalizedField, formatDate, formatPercentage } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, Download, Eye, FileText } from "lucide-react";

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("certificate");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  // Fetch all certificates for this user
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false }) as { data: Array<{
      id: string;
      user_id: string;
      course_id: string;
      exam_attempt_id: string;
      certificate_code: string;
      score_percentage: number;
      issued_at: string;
    }> | null };

  // Fetch course details for each certificate
  const courseIds = [
    ...new Set((certificates ?? []).map((c) => c.course_id)),
  ];

  let courseMap = new Map<
    string,
    { title: string }
  >();

  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    for (const course of courses ?? []) {
      courseMap.set(course.id, {
        title: getLocalizedField(course, "title", locale),
      });
    }
  }

  const enrichedCertificates = (certificates ?? []).map((cert) => ({
    ...cert,
    course_title: courseMap.get(cert.course_id)?.title ?? "",
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-merriweather text-3xl font-bold tracking-tight text-primary">
          {t("myCertificates")}
        </h1>
      </div>

      {enrichedCertificates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Award className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground">
              {t("noCertificates")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrichedCertificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {cert.course_title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t("issuedOn")}: {formatDate(cert.issued_at, locale)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="success">
                    {formatPercentage(cert.score_percentage)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>
                    {t("certificationId")}: {cert.certificate_code}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/certificates/${cert.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("title")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/certificates/${cert.id}`}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("download")}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
