"use client";

import { useActionState } from "react";
import { createAdministrator } from "@/app/admin/settings/actions";

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdministrator, {});
  return <form action={action} className="mt-6 grid gap-5 sm:grid-cols-2">
    <Field name="firstName" label="First name" /><Field name="lastName" label="Last name" />
    <div className="sm:col-span-2"><Field name="email" label="Work email" type="email" /></div>
    <div className="sm:col-span-2"><Field name="password" label="Temporary password" type="password" minLength={12} /></div>
    {state.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-green-800 sm:col-span-2">{state.success}</p>}
    <button disabled={pending} className="bg-ink px-5 py-4 text-sm uppercase tracking-[.18em] text-paper disabled:opacity-50 sm:col-span-2">{pending ? "Creating account..." : "Create administrator"}</button>
  </form>;
}

function Field({ name, label, type = "text", minLength }: { name: string; label: string; type?: string; minLength?: number }) {
  return <label className="block text-sm"><span className="mb-2 block">{label}</span><input required name={name} type={type} minLength={minLength} autoComplete="off" className="w-full border border-black/20 bg-white px-4 py-3 outline-none focus:border-gold" /></label>;
}
