import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) { return updateSession(request); }
// Public pages skip authentication entirely. Protected layouts still check the
// user; the proxy refreshes those sessions and enforces staff permissions.
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/book/:path*",
    "/equipment/:slug/rent/:path*",
  ],
};
