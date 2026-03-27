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

      // Sign out any existing session first (prevents admin session interference)
      await supabase.auth.signOut();

      // Wait briefly for Supabase to process hash fragment tokens
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to get the new session (from hash fragment token exchange)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        if (next.includes("setup-account")) {
          router.push("/pt/setup-account");
        } else {
          router.push(next);
        }
        return;
      }

      // No session established
      setStatus("Sessão não encontrada. A redirecionar...");
      setTimeout(() => router.push("/pt/login?error=auth"), 2000);
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
