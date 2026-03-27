import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateCertificateHTML } from "@/lib/certificates/generate-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  try {
    const { certificateId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch certificate with related data (use admin client to bypass RLS)
    const admin = await createAdminClient();
    const { data: certificate, error } = await admin
      .from("certificates")
      .select(
        `
        *,
        profiles:user_id (full_name, locale),
        courses:course_id (title_pt, title_en)
      `,
      )
      .eq("id", certificateId)
      .single() as { data: {
        id: string;
        user_id: string;
        course_id: string;
        exam_attempt_id: string;
        certificate_code: string;
        score_percentage: number;
        issued_at: string;
        profiles: { full_name: string; locale: string } | null;
        courses: { title_pt: string; title_en: string } | null;
      } | null; error: any };

    if (error || !certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Only allow the certificate owner or admins to download
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (certificate.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch app settings for certificate
    const { data: settings } = await admin.from("app_settings").select("key, value");

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const certProfiles = certificate.profiles as unknown as {
      full_name: string;
      locale: string;
    };
    const certCourses = certificate.courses as unknown as {
      title_pt: string;
      title_en: string;
    };

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/verify/${certificate.certificate_code}`;

    const html = await generateCertificateHTML({
      studentName: certProfiles.full_name,
      courseTitlePt: certCourses.title_pt,
      courseTitleEn: certCourses.title_en,
      scorePercentage: certificate.score_percentage,
      certificateCode: certificate.certificate_code,
      issuedAt: certificate.issued_at,
      issuerName: settingsMap["certificate_issuer_name"] || "",
      institutionName: settingsMap["certificate_institution"] || "",
      verificationUrl,
      locale: certProfiles.locale || "pt",
    });

    // Return HTML that can be printed to PDF by the browser
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="certificate-${certificate.certificate_code}.html"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
