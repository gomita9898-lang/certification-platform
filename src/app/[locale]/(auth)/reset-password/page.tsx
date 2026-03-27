"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password/confirm`,
        },
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="font-[family-name:var(--font-merriweather)] text-2xl font-bold text-primary">
            {t("resetPasswordTitle")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("resetPasswordSubtitle")}
          </CardDescription>
        </div>
      </CardHeader>

      {sent ? (
        <CardContent className="space-y-4">
          <div className="rounded-md bg-success/10 p-4 text-center text-sm text-success">
            {t("resetPasswordSent")}
          </div>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t("login")}
            </Link>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? tCommon("loading") : t("sendResetLink")}
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t("login")}
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
