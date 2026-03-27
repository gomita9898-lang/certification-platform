import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function reset() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "aluno@certificacao.local")
    .single();

  if (!profile) {
    console.log("Student not found");
    return;
  }
  const userId = profile.id;
  console.log("Found Maria Silva:", userId);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId);

  for (const enrollment of enrollments || []) {
    const courseId = enrollment.course_id;
    console.log("Resetting course:", courseId);

    const { data: quizAttempts } = await supabase.from("quiz_attempts").select("id").eq("user_id", userId).eq("course_id", courseId);
    for (const qa of quizAttempts || []) {
      await supabase.from("quiz_answers").delete().eq("attempt_id", qa.id);
    }
    await supabase.from("quiz_attempts").delete().eq("user_id", userId).eq("course_id", courseId);

    const { data: examAttempts } = await supabase.from("exam_attempts").select("id").eq("user_id", userId).eq("course_id", courseId);
    for (const ea of examAttempts || []) {
      await supabase.from("exam_answers").delete().eq("attempt_id", ea.id);
    }
    await supabase.from("exam_attempts").delete().eq("user_id", userId).eq("course_id", courseId);

    await supabase.from("certificates").delete().eq("user_id", userId).eq("course_id", courseId);
    await supabase.from("module_progress").delete().eq("user_id", userId).eq("course_id", courseId);
    await supabase.from("enrollments").update({ completed_at: null }).eq("user_id", userId).eq("course_id", courseId);
  }

  console.log("Done! Maria Silva can now start the course from scratch.");
}

reset().catch(console.error);
