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

  // Handle OAuth/PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle token-based auth (invite, recovery, email confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email",
    });

    if (!error) {
      // For invites, redirect to set-password page
      if (type === "invite") {
        return NextResponse.redirect(`${origin}/pt/accept-invitation`);
      }
      // For recovery, redirect to set-password page too
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/pt/accept-invitation`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/pt/login?error=auth`);
}
