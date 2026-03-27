import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      );
    }

    const { full_name, email, course_id } = await request.json();

    if (!full_name || !email || !course_id) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, course_id" },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // Verify the course exists
    const { data: course } = await adminSupabase
      .from("courses")
      .select("id, title_pt")
      .eq("id", course_id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if user already exists
    const { data: existingProfile } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // User exists — check enrollment
      const { data: existingEnrollment } = await adminSupabase
        .from("enrollments")
        .select("id")
        .eq("user_id", existingProfile.id)
        .eq("course_id", course_id)
        .single();

      if (existingEnrollment) {
        return NextResponse.json(
          { error: "Student is already enrolled in this course" },
          { status: 409 }
        );
      }

      // Enroll existing user
      await adminSupabase.from("enrollments").insert({
        user_id: existingProfile.id,
        course_id,
      });

      return NextResponse.json({
        success: true,
        message: "existing_enrolled",
      });
    }

    // Invite new user — sends email with activation link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/api/auth/callback?next=/pt/setup-account`;

    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role: "student",
          locale: "pt",
        },
        redirectTo,
      });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    // Enroll in course
    if (inviteData?.user) {
      await adminSupabase.from("enrollments").insert({
        user_id: inviteData.user.id,
        course_id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "invited",
      email,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
