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
        { status: 401 },
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
        { status: 403 },
      );
    }

    // Parse request body
    const { studentId, courseId, type, moduleId } = await request.json();

    if (!studentId || !courseId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, courseId, type" },
        { status: 400 },
      );
    }

    if (type === "module" && !moduleId) {
      return NextResponse.json(
        { error: "Missing required field: moduleId (for module reset)" },
        { status: 400 },
      );
    }

    if (!["all", "module", "exam"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'all', 'module', or 'exam'" },
        { status: 400 },
      );
    }

    const adminSupabase = await createAdminClient();

    if (type === "all") {
      // Reset Everything: delete all progress for student+course

      // 1. Delete quiz answers (via quiz_attempts for this course)
      const { data: quizAttemptIds } = await adminSupabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      if (quizAttemptIds && quizAttemptIds.length > 0) {
        const ids = quizAttemptIds.map((a) => a.id);
        await adminSupabase
          .from("quiz_answers")
          .delete()
          .in("attempt_id", ids);
      }

      // 2. Delete quiz attempts
      await adminSupabase
        .from("quiz_attempts")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 3. Delete exam answers (via exam_attempts for this course)
      const { data: examAttemptIds } = await adminSupabase
        .from("exam_attempts")
        .select("id")
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      if (examAttemptIds && examAttemptIds.length > 0) {
        const ids = examAttemptIds.map((a) => a.id);
        await adminSupabase
          .from("exam_answers")
          .delete()
          .in("attempt_id", ids);
      }

      // 4. Delete exam attempts
      await adminSupabase
        .from("exam_attempts")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 5. Delete certificates
      await adminSupabase
        .from("certificates")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 6. Delete module progress
      await adminSupabase
        .from("module_progress")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 7. Reset enrollment completed_at
      await adminSupabase
        .from("enrollments")
        .update({ completed_at: null })
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      return NextResponse.json({
        success: true,
        message: "All progress reset successfully",
      });
    }

    if (type === "module") {
      // Reset Specific Module: delete module progress + quiz data for that module

      // 1. Delete quiz answers (via quiz_attempts for this module)
      const { data: quizAttemptIds } = await adminSupabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", studentId)
        .eq("module_id", moduleId);

      if (quizAttemptIds && quizAttemptIds.length > 0) {
        const ids = quizAttemptIds.map((a) => a.id);
        await adminSupabase
          .from("quiz_answers")
          .delete()
          .in("attempt_id", ids);
      }

      // 2. Delete quiz attempts
      await adminSupabase
        .from("quiz_attempts")
        .delete()
        .eq("user_id", studentId)
        .eq("module_id", moduleId);

      // 3. Delete module progress
      await adminSupabase
        .from("module_progress")
        .delete()
        .eq("user_id", studentId)
        .eq("module_id", moduleId);

      return NextResponse.json({
        success: true,
        message: "Module progress reset successfully",
      });
    }

    if (type === "exam") {
      // Reset Final Exam: delete exam data + certificates (keep module progress)

      // 1. Delete exam answers (via exam_attempts for this course)
      const { data: examAttemptIds } = await adminSupabase
        .from("exam_attempts")
        .select("id")
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      if (examAttemptIds && examAttemptIds.length > 0) {
        const ids = examAttemptIds.map((a) => a.id);
        await adminSupabase
          .from("exam_answers")
          .delete()
          .in("attempt_id", ids);
      }

      // 2. Delete exam attempts
      await adminSupabase
        .from("exam_attempts")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 3. Delete certificates
      await adminSupabase
        .from("certificates")
        .delete()
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      // 4. Reset enrollment completed_at
      await adminSupabase
        .from("enrollments")
        .update({ completed_at: null })
        .eq("user_id", studentId)
        .eq("course_id", courseId);

      return NextResponse.json({
        success: true,
        message: "Exam progress reset successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid reset type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Reset progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
