"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AdminLoginState = { error?: string };
const schema = z.object({ email: z.email(), password: z.string().min(8) });

export async function adminLogin(_: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "The email or password is incorrect." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (!profile || !["staff", "manager", "admin", "owner"].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "This account does not have administrator access." };
  }
  redirect("/admin");
}
