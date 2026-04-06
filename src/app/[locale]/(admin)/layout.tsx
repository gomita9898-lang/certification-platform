import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { UserRole } from "@/types/database";

export default async function AdminLayout({
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

  if (role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  const userName: string = profile?.full_name ?? user.email ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header role={role} userName={userName} locale={locale} />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 sm:px-6 lg:px-8">
        <AdminSidebar />
        <main id="main-content" className="flex-1 py-6 px-4 sm:px-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
