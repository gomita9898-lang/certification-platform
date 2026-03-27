import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // Skip middleware for API routes and static files
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Handle Supabase session refresh first
    const sessionResponse = await updateSession(request);

    // If session middleware redirected, return that
    if (
      sessionResponse &&
      (sessionResponse.status === 307 || sessionResponse.status === 308)
    ) {
      return sessionResponse;
    }

    // Handle internationalization routing
    const intlResponse = intlMiddleware(request);

    // Merge cookies from session response into intl response
    if (intlResponse && sessionResponse) {
      sessionResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
      });
    }

    return intlResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|api).*)"],
};
