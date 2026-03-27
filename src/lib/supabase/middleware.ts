import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<Database, "public", any>;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  ) as TypedSupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(pt|en)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "pt";

  // Auth pages that don't require login
  const authPages = [`/${locale}/login`, `/${locale}/reset-password`, `/${locale}/accept-invitation`];
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));
  const isApiRoute = pathname.startsWith("/api");
  const isVerifyPage = pathname.includes("/verify/");

  // Allow public routes
  if (isApiRoute || isVerifyPage) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    // Check if user is admin to redirect to admin dashboard
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profileData?.role === "admin"
      ? `/${locale}/admin/dashboard`
      : `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Check admin access
  if (user && pathname.includes("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
