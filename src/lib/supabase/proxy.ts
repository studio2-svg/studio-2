import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: items => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && path.startsWith("/admin") && path !== "/admin-login") { const login = request.nextUrl.clone(); login.pathname = "/admin-login"; login.searchParams.set("next", path); return NextResponse.redirect(login); }
  if (!user && path.startsWith("/dashboard")) { const login = request.nextUrl.clone(); login.pathname = "/login"; login.searchParams.set("next", path); return NextResponse.redirect(login); }
  if (user && path.startsWith("/admin") && path !== "/admin-login") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role;
    if (!role || !["staff", "manager", "admin", "owner"].includes(role)) return NextResponse.redirect(new URL("/dashboard", request.url));
    if (["staff", "manager"].includes(role) && path !== "/admin") {
      const moduleKey = path.split("/")[2]?.replace("staff-accounts", "staff");
      const permissions = Array.isArray(user.app_metadata.permissions) ? user.app_metadata.permissions : [];
      if (!moduleKey || !permissions.includes(moduleKey)) return NextResponse.redirect(new URL("/admin", request.url));
    }
  }
  return response;
}
