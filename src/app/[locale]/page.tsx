import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      redirect(`/${locale}/admin/dashboard`);
    } else {
      redirect(`/${locale}/dashboard`);
    }
  } else {
    redirect(`/${locale}/login`);
  }
}
