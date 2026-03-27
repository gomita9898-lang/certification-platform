import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId" },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (studentId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();

    // Delete all related data (cascade should handle most, but be explicit)
    // Quiz answers -> quiz attempts
    const { data: quizAttempts } = await admin
      .from("quiz_attempts")
      .select("id")
      .eq("user_id", studentId);
    for (const qa of quizAttempts ?? []) {
      await admin.from("quiz_answers").delete().eq("attempt_id", qa.id);
    }
    await admin.from("quiz_attempts").delete().eq("user_id", studentId);

    // Exam answers -> exam attempts
    const { data: examAttempts } = await admin
      .from("exam_attempts")
      .select("id")
      .eq("user_id", studentId);
    for (const ea of examAttempts ?? []) {
      await admin.from("exam_answers").delete().eq("attempt_id", ea.id);
    }
    await admin.from("exam_attempts").delete().eq("user_id", studentId);

    // Certificates, module progress, enrollments
    await admin.from("certificates").delete().eq("user_id", studentId);
    await admin.from("module_progress").delete().eq("user_id", studentId);
    await admin.from("enrollments").delete().eq("user_id", studentId);

    // Delete profile
    await admin.from("profiles").delete().eq("id", studentId);

    // Delete auth user (this allows re-invite with same email)
    await admin.auth.admin.deleteUser(studentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
