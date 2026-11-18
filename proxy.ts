import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const IDLE_COOKIE = "admin_last_seen";

/**
 * Admin guard:
 * - refreshes the Supabase session cookie
 * - redirects signed-out visitors from /admin/* to /admin/login
 * - signs the admin out after ADMIN_IDLE_TIMEOUT_MINUTES without a request
 * Authorisation (is this user an admin?) is enforced again in the admin layout and by RLS.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!url || !key) {
    if (isLogin) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login?reason=setup", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isLogin) return response;
    const to = new URL("/admin/login", request.url);
    if (pathname !== "/admin") to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  const idleMinutes = Number(process.env.ADMIN_IDLE_TIMEOUT_MINUTES ?? 30) || 30;
  const last = Number(request.cookies.get(IDLE_COOKIE)?.value ?? 0);
  if (!isLogin && last && Date.now() - last > idleMinutes * 60_000) {
    await supabase.auth.signOut();
    const to = NextResponse.redirect(new URL("/admin/login?reason=idle", request.url));
    for (const c of response.cookies.getAll()) to.cookies.set(c);
    to.cookies.delete(IDLE_COOKIE);
    return to;
  }

  response.cookies.set(IDLE_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
