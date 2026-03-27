import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { error: "Certificate code is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(
        "id, certificate_code, score_percentage, issued_at, user_id, course_id, profiles(full_name, email), courses(title_pt, title_en)"
      )
      .eq("certificate_code", code.toUpperCase())
      .single() as { data: {
        id: string;
        certificate_code: string;
        score_percentage: number;
        issued_at: string;
        user_id: string;
        course_id: string;
        profiles: { full_name: string; email: string } | null;
        courses: { title_pt: string; title_en: string } | null;
      } | null; error: any };

    if (error || !certificate) {
      return NextResponse.json(
        {
          verified: false,
          error: "Certificate not found",
        },
        { status: 404 }
      );
    }

    const profile = certificate.profiles as {
      full_name: string;
      email: string;
    } | null;
    const course = certificate.courses as {
      title_pt: string;
      title_en: string;
    } | null;

    return NextResponse.json({
      verified: true,
      certificate: {
        certificate_code: certificate.certificate_code,
        student_name: profile?.full_name ?? null,
        course_title_pt: course?.title_pt ?? null,
        course_title_en: course?.title_en ?? null,
        score_percentage: certificate.score_percentage,
        issued_at: certificate.issued_at,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
