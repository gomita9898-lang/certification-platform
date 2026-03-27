import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ImportOption {
  text_pt: string;
  text_en: string;
  is_correct: boolean;
  order_index: number;
}

interface ImportQuestion {
  module_id: string | null;
  question_pt: string;
  question_en: string;
  explanation_pt: string | null;
  explanation_en: string | null;
  is_exam_question: boolean;
  options: ImportOption[];
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
        { status: 403 },
      );
    }

    // Parse request body
    const { questions, courseId } = (await request.json()) as {
      questions: ImportQuestion[];
      courseId: string;
    };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions provided" },
        { status: 400 },
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 },
      );
    }

    // Verify the course exists
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get current max order_index for questions in this course
    const { data: existingQuestions } = await supabase
      .from("questions")
      .select("order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: false })
      .limit(1);

    let nextOrderIndex =
      existingQuestions && existingQuestions.length > 0
        ? existingQuestions[0].order_index + 1
        : 1;

    const results: {
      imported: number;
      errors: { index: number; error: string }[];
    } = {
      imported: 0,
      errors: [],
    };

    // Import questions one by one
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      try {
        // Insert question
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert({
            module_id: q.module_id,
            course_id: courseId,
            question_pt: q.question_pt,
            question_en: q.question_en,
            explanation_pt: q.explanation_pt,
            explanation_en: q.explanation_en,
            is_exam_question: q.is_exam_question,
            order_index: nextOrderIndex,
          })
          .select()
          .single();

        if (questionError) {
          results.errors.push({
            index: i,
            error: questionError.message,
          });
          continue;
        }

        // Insert options
        const optionsToInsert = q.options.map((opt) => ({
          question_id: questionData.id,
          text_pt: opt.text_pt,
          text_en: opt.text_en,
          is_correct: opt.is_correct,
          order_index: opt.order_index,
        }));

        const { error: optionsError } = await supabase
          .from("question_options")
          .insert(optionsToInsert);

        if (optionsError) {
          // Roll back the question if options failed
          await supabase
            .from("questions")
            .delete()
            .eq("id", questionData.id);

          results.errors.push({
            index: i,
            error: `Options error: ${optionsError.message}`,
          });
          continue;
        }

        results.imported++;
        nextOrderIndex++;
      } catch (err) {
        results.errors.push({
          index: i,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      errors: results.errors,
      total: questions.length,
    });
  } catch (error) {
    console.error("Import questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
