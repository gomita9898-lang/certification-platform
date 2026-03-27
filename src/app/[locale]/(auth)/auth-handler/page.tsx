"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Client-side auth handler.
 * Supabase sends invite/recovery tokens as URL hash fragments (#access_token=...)
 * which server-side routes cannot read. This page reads the hash, establishes
 * a session, then redirects to the appropriate page.
 */
export default function AuthHandlerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("A processar...");

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient();
      const next = searchParams.get("next") ?? "/pt/dashboard";

      // Check if we already have a session (from the server callback)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Check if this is an invite (user has no password set yet / just invited)
        const isInvite = session.user?.user_metadata?.role === "student" &&
          !session.user?.user_metadata?.password_set;

        if (isInvite || next.includes("setup-account")) {
          router.push("/pt/setup-account");
        } else {
          router.push(next);
        }
        return;
      }

      // Try to get session from hash fragment (Supabase auth callback)
      // The Supabase client automatically reads the hash fragment
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth handler error:", error);
        setStatus("Erro de autenticação. A redirecionar...");
        setTimeout(() => router.push("/pt/login?error=auth"), 2000);
        return;
      }

      if (data.session) {
        const type = new URLSearchParams(window.location.hash.substring(1)).get("type");

        if (type === "invite" || type === "recovery") {
          router.push("/pt/setup-account");
        } else {
          router.push(next);
        }
      } else {
        setStatus("Sessão não encontrada. A redirecionar...");
        setTimeout(() => router.push("/pt/login?error=auth"), 2000);
      }
    }

    handleAuth();
  }, [router, searchParams]);

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">{status}</p>
      </CardContent>
    </Card>
  );
}
