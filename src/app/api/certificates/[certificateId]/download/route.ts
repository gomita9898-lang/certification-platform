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

    const admin = await createAdminClient();

    // Fetch certificate
    const { data: certificate, error } = await admin
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .single();

    if (error || !certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Only allow the certificate owner or admins to download
    const { data: userProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (certificate.user_id !== user.id && userProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch student profile
    const { data: studentProfile } = await admin
      .from("profiles")
      .select("full_name, locale")
      .eq("id", certificate.user_id)
      .single();

    // Fetch course
    const { data: course } = await admin
      .from("courses")
      .select("title_pt, title_en")
      .eq("id", certificate.course_id)
      .single();

    // Fetch app settings
    const { data: settings } = await admin
      .from("app_settings")
      .select("key, value");

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = s.value;
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/verify/${certificate.certificate_code}`;

    const html = await generateCertificateHTML({
      studentName: studentProfile?.full_name ?? "",
      courseTitlePt: course?.title_pt ?? "",
      courseTitleEn: course?.title_en ?? "",
      scorePercentage: certificate.score_percentage,
      certificateCode: certificate.certificate_code,
      issuedAt: certificate.issued_at,
      issuerName: settingsMap["certificate_issuer_name"] || "",
      institutionName: settingsMap["certificate_institution"] || "",
      verificationUrl,
      locale: studentProfile?.locale || "pt",
    });

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
