import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  // 1. List all profiles
  console.log("=== ALL PROFILES ===");
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role");

  if (profilesError) console.error("Profiles error:", profilesError);
  else profiles?.forEach(p => console.log(`  ${p.role}: ${p.email} (${p.full_name})`));

  // 2. List all enrollments
  console.log("\n=== ALL ENROLLMENTS ===");
  const { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("user_id, course_id, enrolled_at, completed_at");

  if (enrollError) console.error("Enrollments error:", enrollError);
  else enrollments?.forEach(e => console.log(`  user: ${e.user_id}, course: ${e.course_id}, completed: ${e.completed_at}`));

  // 3. List certificates
  console.log("\n=== ALL CERTIFICATES ===");
  const { data: certs } = await supabase
    .from("certificates")
    .select("user_id, course_id, certificate_code, score_percentage");
  certs?.forEach(c => console.log(`  user: ${c.user_id}, code: ${c.certificate_code}, score: ${c.score_percentage}`));

  // 4. Check franciscogama98@gmail.com user
  console.log("\n=== CHECKING franciscogama98@gmail.com ===");
  const { data: fUser } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("email", "franciscogama98@gmail.com")
    .single();

  if (fUser) {
    console.log(`  Found: ${fUser.full_name} (${fUser.role}), ID: ${fUser.id}`);

    // Delete their data to allow fresh invite
    console.log("  Deleting enrollments...");
    await supabase.from("enrollments").delete().eq("user_id", fUser.id);

    console.log("  Deleting profile...");
    await supabase.from("profiles").delete().eq("id", fUser.id);

    console.log("  Deleting auth user...");
    await supabase.auth.admin.deleteUser(fUser.id);

    console.log("  ✓ User franciscogama98@gmail.com fully deleted — ready for re-invite");
  } else {
    console.log("  Not found in profiles");

    // Check auth.users directly
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === "franciscogama98@gmail.com");
    if (authUser) {
      console.log(`  Found in auth.users: ${authUser.id}`);
      await supabase.auth.admin.deleteUser(authUser.id);
      console.log("  ✓ Auth user deleted");
    } else {
      console.log("  Not found anywhere — clean for invite");
    }
  }

  // 5. Verify quiz/exam data exists for reports
  console.log("\n=== QUIZ ATTEMPTS ===");
  const { data: quizAttempts } = await supabase.from("quiz_attempts").select("user_id, module_id, score, total_questions");
  console.log(`  ${quizAttempts?.length ?? 0} quiz attempts`);
  quizAttempts?.forEach(q => console.log(`    user: ${q.user_id}, score: ${q.score}/${q.total_questions}`));

  console.log("\n=== EXAM ATTEMPTS ===");
  const { data: examAttempts } = await supabase.from("exam_attempts").select("user_id, course_id, score, percentage, passed");
  console.log(`  ${examAttempts?.length ?? 0} exam attempts`);
  examAttempts?.forEach(e => console.log(`    user: ${e.user_id}, score: ${e.score}, ${e.percentage}%, passed: ${e.passed}`));
}

run().catch(console.error);
