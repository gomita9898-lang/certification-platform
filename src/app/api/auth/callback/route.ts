import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/pt/dashboard";

  const supabase = await createClient();

  // For invite and recovery flows, sign out any existing session first
  // This prevents the admin's session from interfering when testing invite links
  if (type === "invite" || type === "recovery" || next.includes("setup-account")) {
    await supabase.auth.signOut();
  }

  // Handle OAuth/PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next.includes("setup-account")) {
        return NextResponse.redirect(`${origin}/pt/setup-account`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code exchange error:", error);
  }

  // Handle token-based auth (invite, recovery, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });

    if (!error) {
      if (type === "invite" || type === "recovery") {
        return NextResponse.redirect(`${origin}/pt/setup-account`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OTP verification error:", error);
  }

  // Fallback: redirect to client-side handler for hash fragments
  return NextResponse.redirect(`${origin}/pt/auth-handler?next=${encodeURIComponent(next)}`);
}
