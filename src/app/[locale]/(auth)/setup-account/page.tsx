"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Eye, EyeOff, CheckCircle, XCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

type Step = "setup" | "success";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
}

function getPasswordStrength(password: string, locale: string): PasswordStrength {
  const isPt = locale === "pt";
  const checks = [
    {
      label: isPt ? "Pelo menos 8 caracteres" : "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: isPt ? "Contém letra maiúscula" : "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: isPt ? "Contém letra minúscula" : "Contains lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: isPt ? "Contém número" : "Contains number",
      met: /[0-9]/.test(password),
    },
  ];

  const score = checks.filter((c) => c.met).length;

  const labels = isPt
    ? ["", "Fraca", "Razoável", "Boa", "Forte"]
    : ["", "Weak", "Fair", "Good", "Strong"];

  const colors = ["", "bg-destructive", "bg-orange-400", "bg-yellow-500", "bg-success"];

  return { score, label: labels[score], color: colors[score], checks };
}

export default function SetupAccountPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("setup");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const locale = searchParams.get("locale") || "pt";

  const strength = useMemo(() => getPasswordStrength(password, locale), [password, locale]);

  // Get user info from the active session (created when they clicked the invite link)
  useEffect(() => {
    async function getSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? "");
        setFullName(user.user_metadata?.full_name ?? "");
        setSessionReady(true);
      } else {
        // No session — link may have expired or was already used
        setError(
          locale === "pt"
            ? "O link de ativação expirou ou já foi utilizado. Contacte o administrador para obter um novo convite."
            : "The activation link has expired or was already used. Contact the administrator for a new invitation."
        );
      }
    }
    getSession();
  }, [locale]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate
    if (strength.score < 3) {
      setError(
        locale === "pt"
          ? "A palavra-passe deve cumprir pelo menos 3 dos 4 requisitos de segurança."
          : "Password must meet at least 3 of 4 security requirements."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        locale === "pt"
          ? "As palavras-passe não coincidem."
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sign out so they use their new password to login
      await supabase.auth.signOut();

      setStep("success");
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="px-8 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-merriweather text-2xl font-bold text-primary">
            {locale === "pt" ? "Conta Configurada!" : "Account Ready!"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {locale === "pt"
              ? "A sua conta foi configurada com sucesso. Utilize as suas credenciais para iniciar sessão."
              : "Your account has been set up successfully. Use your credentials to log in."}
          </p>

          <div className="mt-6 rounded-md border bg-muted/50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="mt-1 font-mono text-sm font-medium">{email}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {locale === "pt" ? "Palavra-passe" : "Password"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "pt"
                ? "A palavra-passe que acabou de definir"
                : "The password you just set"}
            </p>
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => router.push(`/${locale}/login`)}
          >
            {locale === "pt" ? "Ir para Iniciar Sessão" : "Go to Login"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <CardTitle className="font-merriweather text-2xl font-bold text-primary">
            {locale === "pt"
              ? "Bem-vindo à Plataforma de Certificação"
              : "Welcome to the Certification Platform"}
          </CardTitle>
          <CardDescription className="text-base">
            {fullName ? (
              <>
                {locale === "pt" ? "Olá, " : "Hello, "}
                <span className="font-semibold text-foreground">{fullName}</span>
                {locale === "pt"
                  ? "! Configure a sua conta para começar."
                  : "! Set up your account to get started."}
              </>
            ) : (
              locale === "pt"
                ? "Configure a sua palavra-passe para aceder à plataforma."
                : "Set your password to access the platform."
            )}
          </CardDescription>
        </div>
      </CardHeader>

      {error && !sessionReady ? (
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSetPassword}>
          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email — pre-filled, read-only */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === "pt" ? "Nova Palavra-passe" : "New Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= strength.score ? strength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {strength.label}
                    </span>
                  </div>

                  {/* Requirements checklist */}
                  <div className="space-y-1">
                    {strength.checks.map((check, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs ${
                          check.met ? "text-success" : "text-muted-foreground"
                        }`}
                      >
                        {check.met ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locale === "pt" ? "Confirmar Palavra-passe" : "Confirm Password"}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <XCircle className="h-3 w-3" />
                  {locale === "pt"
                    ? "As palavras-passe não coincidem"
                    : "Passwords do not match"}
                </p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-success">
                  <CheckCircle className="h-3 w-3" />
                  {locale === "pt"
                    ? "As palavras-passe coincidem"
                    : "Passwords match"}
                </p>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <Shield className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {locale === "pt"
                  ? "A sua palavra-passe é encriptada e nunca é armazenada em texto simples. Utilize uma palavra-passe única que não utilize noutros serviços."
                  : "Your password is encrypted and never stored in plain text. Use a unique password that you don't use on other services."}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !sessionReady || strength.score < 3 || password !== confirmPassword}
            >
              {loading
                ? tCommon("loading")
                : locale === "pt"
                  ? "Configurar Conta"
                  : "Set Up Account"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
