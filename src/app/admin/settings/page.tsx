import { CreateAdminForm } from "@/components/create-admin-form";
import { requireOwner } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const { supabase } = await requireOwner();
  const { data: administrators } = await supabase.from("profiles").select("id, first_name, last_name, email, role").in("role", ["admin", "owner"]).order("created_at");
  return <>
    <p className="text-xs uppercase tracking-[.22em] text-gold">Access control</p>
    <h1 className="mt-2 font-display text-5xl">Admin accounts</h1>
    <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Create administrator accounts here. They are confirmed immediately and do not use the client registration or email-verification flow.</p>
    <section className="mt-10 max-w-2xl bg-paper p-6 sm:p-8"><h2 className="font-display text-3xl">Add an administrator</h2><CreateAdminForm /></section>
    <section className="mt-8 max-w-2xl"><h2 className="font-display text-3xl">Current administrators</h2><div className="mt-4 divide-y divide-black/10 border-y border-black/10">{administrators?.map(person => <div key={person.id} className="flex items-center justify-between gap-4 py-4"><div><p>{[person.first_name, person.last_name].filter(Boolean).join(" ") || "Unnamed administrator"}</p><p className="text-sm text-black/50">{person.email}</p></div><span className="text-xs uppercase tracking-[.16em] text-gold">{person.role}</span></div>)}</div></section>
  </>;
}
