"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
export type AuthState = { error?: string };
const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });
const registerSchema = loginSchema.extend({ firstName: z.string().trim().min(1), lastName: z.string().trim().min(1) });
export async function login(_: AuthState, formData: FormData): Promise<AuthState> { const parsed = loginSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Enter a valid email and password." }; const { error } = await (await createClient()).auth.signInWithPassword(parsed.data); if (error) return { error: "The email or password is incorrect." }; redirect("/dashboard"); }
export async function register(_: AuthState, formData: FormData): Promise<AuthState> { const parsed = registerSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: "Complete every field with valid details." }; const { email, password, firstName, lastName } = parsed.data; const { error } = await (await createClient()).auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } }); if (error) return { error: error.message }; redirect("/login?registered=1"); }
export async function logout() { await (await createClient()).auth.signOut(); redirect("/"); }
