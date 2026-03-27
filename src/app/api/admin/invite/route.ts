import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
        message: "Existing user enrolled in course",
        user_id: existingProfile.id,
      });
    }

    // Create new user with generated password
    const password = generatePassword();

    const { data: newUser, error: createError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: "student",
          locale: "pt",
        },
      });

    if (createError) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    if (!newUser?.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Enroll in course
    await adminSupabase.from("enrollments").insert({
      user_id: newUser.user.id,
      course_id,
    });

    // Send welcome email with credentials via Supabase
    // For now, return the credentials so the admin can share them
    return NextResponse.json({
      success: true,
      message: "Student created and enrolled successfully",
      user_id: newUser.user.id,
      credentials: {
        email,
        password,
        note: "Share these credentials with the student. They can change their password after logging in.",
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
