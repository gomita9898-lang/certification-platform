import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetAdmin() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "admin@certificacao.local")
    .single();

  if (!profile) {
    console.log("Admin not found");
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(profile.id, {
    password: "admin123456",
  });

  if (error) {
    console.error("Error resetting admin password:", error);
  } else {
    console.log("✓ Admin password reset to: admin123456");
  }
}

resetAdmin().catch(console.error);
