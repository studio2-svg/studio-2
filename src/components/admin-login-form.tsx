"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/(admin-auth)/admin/login/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, {});
  return <form action={action} className="mt-10 space-y-5">
    <Field name="email" label="Work email" type="email" autoComplete="email" />
    <Field name="password" label="Password" type="password" autoComplete="current-password" />
    {state.error && <p role="alert" className="border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{state.error}</p>}
    <button disabled={pending} className="w-full bg-gold px-5 py-4 text-sm uppercase tracking-[.2em] text-ink disabled:opacity-50">{pending ? "Signing in..." : "Sign in to administration"}</button>
  </form>;
}

function Field({ name, label, type, autoComplete }: { name: string; label: string; type: string; autoComplete: string }) {
  return <label className="block text-sm text-white/75"><span className="mb-2 block">{label}</span><input required name={name} type={type} autoComplete={autoComplete} minLength={type === "password" ? 8 : undefined} className="w-full border border-white/20 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold" /></label>;
}
