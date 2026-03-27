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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    // Parse request body
    const { full_name, email, course_id } = await request.json();

    if (!full_name || !email || !course_id) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, course_id" },
        { status: 400 }
      );
    }

    // Verify the course exists
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", course_id)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Use admin client to invite user
    const adminSupabase = await createAdminClient();

    const { data: inviteData, error: inviteError } =
      await adminSupabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role: "student",
        },
      });

    if (inviteError) {
      // Handle duplicate email
      if (
        inviteError.message?.includes("already") ||
        inviteError.message?.includes("duplicate") ||
        inviteError.status === 422
      ) {
        // User already exists — try to find them and enroll
        const { data: existingUsers } =
          await adminSupabase.auth.admin.listUsers();

        const existingUser = existingUsers?.users?.find(
          (u) => u.email === email
        );

        if (existingUser) {
          // Check if already enrolled
          const { data: existingEnrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", existingUser.id)
            .eq("course_id", course_id)
            .single();

          if (existingEnrollment) {
            return NextResponse.json(
              { error: "Student is already enrolled in this course" },
              { status: 409 }
            );
          }

          // Enroll existing user
          const { error: enrollError } = await adminSupabase
            .from("enrollments")
            .insert({
              user_id: existingUser.id,
              course_id,
            });

          if (enrollError) {
            return NextResponse.json(
              { error: "Failed to create enrollment" },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            message: "Existing user enrolled in course",
            user_id: existingUser.id,
          });
        }

        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    // Create enrollment for the newly invited user
    if (inviteData?.user) {
      const { error: enrollError } = await adminSupabase
        .from("enrollments")
        .insert({
          user_id: inviteData.user.id,
          course_id,
        });

      if (enrollError) {
        console.error("Failed to create enrollment:", enrollError);
        // User was created but enrollment failed — log but still return success
        return NextResponse.json({
          success: true,
          message: "User invited but enrollment creation failed",
          user_id: inviteData.user.id,
          enrollment_warning: enrollError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Student invited and enrolled successfully",
      user_id: inviteData?.user?.id,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
