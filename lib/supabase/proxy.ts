import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/lib/supabase/database.types";

const SESSION_HEADER_NAMES = ["cache-control", "expires", "pragma"] as const;

function redirectWithSessionCookies(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  SESSION_HEADER_NAMES.forEach((headerName) => {
    const value = sourceResponse.headers.get(headerName);
    if (value) {
      redirectResponse.headers.set(headerName, value);
    }
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const environment = getPublicEnvironment();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const hasVerifiedClaims = Boolean(data?.claims);
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/login" || pathname === "/operadora" || pathname === "/admin/login" || pathname.startsWith("/auth/");

  if (!hasVerifiedClaims && !isPublicRoute) {
    return redirectWithSessionCookies(request, supabaseResponse, "/login");
  }

  return supabaseResponse;
}
