"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Eye, EyeOff, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, Link } from "@/lib/i18n/routing";
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

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t("invalidCredentials"));
        return;
      }

      // Check role to redirect to correct dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError(t("invalidCredentials"));
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
          <CardTitle className="font-merriweather text-2xl font-bold text-primary">
            {tCommon("appName")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("loginSubtitle")}
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {/* Platform info for first-time visitors */}
          <div className="rounded-md bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            {t("inviteOnly")}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive" role="alert">
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
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href="/reset-password"
                className="text-xs text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              tCommon("loading")
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {t("login")}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
