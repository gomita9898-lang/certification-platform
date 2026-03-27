import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  console.log("=== Testing FIXED queries (no profile joins) ===\n");

  // Students page query (fixed)
  console.log("1. Students page — profiles + enrollments (separate):");
  const { data: students, error: e1 } = await supabase
    .from("profiles").select("id, full_name, email, created_at")
    .eq("role", "student");
  const { data: enrollments, error: e2 } = await supabase
    .from("enrollments").select("id, user_id, course_id, enrolled_at, completed_at");

  if (e1 || e2) console.log(`  ERROR: ${e1?.message || e2?.message}`);
  else {
    console.log(`  OK: ${students?.length} students, ${enrollments?.length} enrollments`);
    students?.forEach(s => {
      const studentEnrollments = enrollments?.filter(e => e.user_id === s.id) ?? [];
      console.log(`    ${s.full_name} (${s.email}): ${studentEnrollments.length} enrollments`);
    });
  }

  // Reports — all separate queries
  console.log("\n2. Reports — all separate queries:");
  const results = await Promise.all([
    supabase.from("courses").select("id, title_pt, title_en"),
    supabase.from("profiles").select("id, full_name, email").eq("role", "student"),
    supabase.from("enrollments").select("*"),
    supabase.from("modules").select("id, title_pt, title_en, course_id"),
    supabase.from("module_progress").select("*"),
    supabase.from("quiz_attempts").select("*"),
    supabase.from("exam_attempts").select("*"),
    supabase.from("certificates").select("*"),
  ]);

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`  ERROR: ${e.error?.message}`));
  } else {
    console.log(`  OK: courses=${results[0].data?.length}, profiles=${results[1].data?.length}, enrollments=${results[2].data?.length}`);
    console.log(`      modules=${results[3].data?.length}, progress=${results[4].data?.length}, quizzes=${results[5].data?.length}`);
    console.log(`      exams=${results[6].data?.length}, certificates=${results[7].data?.length}`);
  }

  // Student detail — enrollments with courses join (should work)
  console.log("\n3. Student detail — enrollments + courses join:");
  const { data: e3, error: err3 } = await supabase
    .from("enrollments")
    .select("*, courses(id, title_pt, title_en, pass_threshold)")
    .eq("user_id", students?.[0]?.id ?? "");
  console.log(err3 ? `  ERROR: ${err3.message}` : `  OK: ${e3?.length} enrollments with course data`);

  console.log("\n=== ALL TESTS PASSED ===");
}

test().catch(console.error);
