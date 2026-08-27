import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type AppRole = "customer" | "staff" | "manager" | "admin" | "owner";
type AuthenticatedUser = { id: string; email?: string; app_metadata: Record<string, unknown> };
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  const user: AuthenticatedUser = {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
    app_metadata: data.claims.app_metadata && typeof data.claims.app_metadata === "object"
      ? data.claims.app_metadata as Record<string, unknown>
      : {},
  };
  return { supabase, user };
});
export const requireAdmin = cache(async () => { const { supabase, user } = await requireUser(); const { data } = await supabase.from("profiles").select("role, first_name, last_name").eq("id", user.id).single(); if (!data || !["staff", "manager", "admin", "owner"].includes(data.role)) redirect("/dashboard"); const permissions=Array.isArray(user.app_metadata.permissions)?user.app_metadata.permissions.filter((x):x is string=>typeof x==="string"):[]; return { supabase, user, profile: { ...data, permissions } as { role: AppRole; first_name: string; last_name: string; permissions: string[] } }; });
export const requireOwner = cache(async () => { const session = await requireAdmin(); if (session.profile.role !== "owner") redirect("/admin"); return session; });
