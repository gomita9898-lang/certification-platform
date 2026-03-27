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

  // Handle OAuth/PKCE code exchange (used by Supabase after email link click)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
      if (type === "invite") {
        return NextResponse.redirect(`${origin}/pt/setup-account`);
      }
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/pt/setup-account`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OTP verification error:", error);
  }

  // If we reach here, try the hash fragment approach
  // Supabase sometimes sends tokens as hash fragments which the server can't read
  // Redirect to a client-side page that can handle hash fragments
  return NextResponse.redirect(`${origin}/pt/auth-handler?next=${encodeURIComponent(next)}`);
}
