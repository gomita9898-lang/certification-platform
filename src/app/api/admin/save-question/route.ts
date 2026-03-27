import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { question, options, moduleId, courseId } = body;

    const admin = await createAdminClient();

    let questionId = question.id;

    if (question._isNew) {
      const { data, error } = await admin
        .from("questions")
        .insert({
          module_id: moduleId,
          course_id: courseId,
          question_pt: question.question_pt,
          question_en: question.question_en,
          explanation_pt: question.explanation_pt || null,
          explanation_en: question.explanation_en || null,
          order_index: question.order_index,
        })
        .select()
        .single();

      if (error) throw error;
      questionId = (data as Record<string, unknown>).id as string;
    } else {
      const { error } = await admin
        .from("questions")
        .update({
          question_pt: question.question_pt,
          question_en: question.question_en,
          explanation_pt: question.explanation_pt || null,
          explanation_en: question.explanation_en || null,
          order_index: question.order_index,
        })
        .eq("id", questionId);

      if (error) throw error;
    }

    // Handle options
    for (const opt of options) {
      if (opt._deleted && opt.id) {
        await admin.from("question_options").delete().eq("id", opt.id);
      } else if (opt._isNew || !opt.id) {
        await admin.from("question_options").insert({
          question_id: questionId,
          text_pt: opt.text_pt,
          text_en: opt.text_en,
          is_correct: opt.is_correct,
          order_index: opt.order_index,
        });
      } else {
        await admin
          .from("question_options")
          .update({
            text_pt: opt.text_pt,
            text_en: opt.text_en,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          })
          .eq("id", opt.id);
      }
    }

    return NextResponse.json({ questionId });
  } catch (error) {
    console.error("Save question error:", error);
    return NextResponse.json(
      { error: "Failed to save question" },
      { status: 500 },
    );
  }
}

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
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { questionId } = await request.json();
    const admin = await createAdminClient();

    await admin.from("question_options").delete().eq("question_id", questionId);
    await admin.from("questions").delete().eq("id", questionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
