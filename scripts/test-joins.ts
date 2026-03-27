import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  // Test: enrollments -> courses (should work, direct FK)
  console.log("1. enrollments + courses join:");
  const { data: e1, error: err1 } = await supabase
    .from("enrollments")
    .select("*, courses(title_pt)")
    .limit(1);
  console.log(err1 ? `  ERROR: ${err1.message}` : `  OK: ${e1?.length} rows`);

  // Test: module_progress -> modules (should work, direct FK)
  console.log("2. module_progress + modules join:");
  const { data: e2, error: err2 } = await supabase
    .from("module_progress")
    .select("*, modules(title_pt)")
    .limit(1);
  console.log(err2 ? `  ERROR: ${err2.message}` : `  OK: ${e2?.length} rows`);

  // Test: quiz_attempts -> modules (should work)
  console.log("3. quiz_attempts + modules join:");
  const { data: e3, error: err3 } = await supabase
    .from("quiz_attempts")
    .select("*, modules(title_pt)")
    .limit(1);
  console.log(err3 ? `  ERROR: ${err3.message}` : `  OK: ${e3?.length} rows`);

  // Test: simple selects without joins
  console.log("\n4. Simple profiles select:");
  const { data: p, error: perr } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student");
  console.log(perr ? `  ERROR: ${perr.message}` : `  OK: ${p?.length} students`);

  console.log("5. Simple enrollments select:");
  const { data: en, error: enerr } = await supabase
    .from("enrollments")
    .select("*");
  console.log(enerr ? `  ERROR: ${enerr.message}` : `  OK: ${en?.length} enrollments`);
}

test().catch(console.error);
