import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type AppRole = "customer" | "staff" | "manager" | "admin" | "owner";
export const requireUser = cache(async () => { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); return { supabase, user }; });
export const requireAdmin = cache(async () => { const { supabase, user } = await requireUser(); const { data } = await supabase.from("profiles").select("role, first_name, last_name").eq("id", user.id).single(); if (!data || !["admin", "owner"].includes(data.role)) redirect("/dashboard"); return { supabase, user, profile: data as { role: AppRole; first_name: string; last_name: string } }; });
