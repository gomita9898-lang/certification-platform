import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  console.log("=== Testing students page query ===");
  const { data: students, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, enrollments(id, completed_at, enrolled_at)")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (error) console.error("ERROR:", error);
  else {
    console.log("Students found:", students?.length);
    students?.forEach((s: any) => {
      console.log(`  ${s.full_name} (${s.email}), enrollments: ${Array.isArray(s.enrollments) ? s.enrollments.length : "N/A"}`);
    });
  }

  console.log("\n=== Testing reports enrollments query ===");
  const { data: enrollments, error: eErr } = await supabase
    .from("enrollments")
    .select("*, profiles:user_id(full_name, email), courses:course_id(title_pt, title_en)")
    .order("enrolled_at", { ascending: false });

  if (eErr) console.error("ERROR:", eErr);
  else {
    console.log("Enrollments found:", enrollments?.length);
    enrollments?.forEach((e: any) => console.log(`  ${e.profiles?.full_name} -> ${e.courses?.title_pt}`));
  }

  console.log("\n=== Testing reports certificates query ===");
  const { data: certs, error: cErr } = await supabase
    .from("certificates")
    .select("*, profiles:user_id(full_name, email), courses:course_id(title_pt, title_en)");

  if (cErr) console.error("ERROR:", cErr);
  else {
    console.log("Certificates found:", certs?.length);
    certs?.forEach((c: any) => console.log(`  ${c.profiles?.full_name} - ${c.certificate_code}`));
  }
}

test().catch(console.error);
