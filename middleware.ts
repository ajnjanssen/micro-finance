import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "./src/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/storage-not-ready" ||
    pathname.startsWith("/auth/callback");

  if (!user && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (
    user &&
    process.env.NODE_ENV === "production" &&
    process.env.SUPABASE_DATA_BACKEND_ENABLED !== "true" &&
    !isPublicRoute
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error:
            "Supabase financial storage is not enabled for this deployment.",
        },
        { status: 503 },
      );
    }

    return NextResponse.redirect(new URL("/storage-not-ready", request.url));
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const destination =
      next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
