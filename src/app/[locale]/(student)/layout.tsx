import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { UserRole } from "@/types/database";

export default async function StudentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role: UserRole = profile?.role ?? "student";
  const userName: string = profile?.full_name ?? user.email ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header role={role} userName={userName} locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
