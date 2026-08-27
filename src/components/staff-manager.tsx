"use client";

import Image from "next/image";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { SaveButton, TextArea, TextField } from "@/components/admin-form-fields";
import { deleteStaffMember, saveStaffMember } from "@/app/admin/staff/actions";

type Category = { id: string; name: string };
export type StaffMember = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  profile_photo_url: string | null;
  bio: string | null;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  base_price_minor: number;
  pricing_type: string;
  status: string;
  featured: boolean;
  staff_categories: { name: string } | null;
};

export function StaffManager({ members, categories }: { members: StaffMember[]; categories: Category[] }) {
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);
  const [viewing, setViewing] = useState<StaffMember | null>(null);
  return <>
    <div className="flex justify-end">
      <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-sm text-paper transition hover:bg-gold hover:text-ink">
        <Plus size={17} /> Add staff member
      </button>
    </div>
    <div className="overflow-x-auto border border-black/10 bg-paper">
      <table className="w-full min-w-[54rem] text-left text-sm">
        <thead className="border-b border-black/10 text-black/45"><tr><th className="p-4">Team member</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4">Homepage</th><th className="p-4 text-right">Actions</th></tr></thead>
        <tbody>{members.map(member => <tr key={member.id} className="border-b border-black/10 transition hover:bg-white">
          <td className="p-4"><div className="flex items-center gap-3">{member.profile_photo_url ? <Image src={member.profile_photo_url} alt="" width={42} height={42} className="size-10 rounded-full object-cover" unoptimized /> : <span className="grid size-10 place-items-center rounded-full bg-black/5 font-medium">{member.name.charAt(0)}</span>}<div><strong className="block">{member.name}</strong><span className="text-xs text-black/50">{member.role_title || "Team member"}</span></div></div></td>
          <td className="p-4">{member.staff_categories?.name || "—"}</td>
          <td className="p-4">GHS {(member.base_price_minor / 100).toFixed(2)} · {member.pricing_type}</td>
          <td className="p-4 capitalize">{member.status}</td>
          <td className="p-4">{member.featured ? "Featured" : "Not featured"}</td>
          <td className="p-4"><div className="flex justify-end gap-2">
            <Icon label="View" onClick={() => setViewing(member)}><Eye size={16} /></Icon>
            <Icon label="Edit" onClick={() => setEditing(member)}><Pencil size={16} /></Icon>
            <ActionForm action={deleteStaffMember} successMessage={`${member.name} deleted.`} className="inline"><input type="hidden" name="id" value={member.id} /><button aria-label={`Delete ${member.name}`} className="grid size-9 place-items-center border border-black/15 text-red-700 transition hover:bg-red-700 hover:text-white"><Trash2 size={16} /></button></ActionForm>
          </div></td>
        </tr>)}</tbody>
      </table>
      {!members.length && <p className="p-6 text-sm text-black/50">No team members have been added yet.</p>}
    </div>
    {editing && <Modal title={editing === "new" ? "Add staff member" : `Edit ${editing.name}`} close={() => setEditing(null)}><StaffForm member={editing === "new" ? undefined : editing} categories={categories} /></Modal>}
    {viewing && <Modal title={viewing.name} close={() => setViewing(null)}><div className="grid gap-5 sm:grid-cols-[12rem_1fr]">{viewing.profile_photo_url && <Image src={viewing.profile_photo_url} alt={viewing.name} width={400} height={500} className="aspect-[4/5] w-full object-cover" unoptimized />}<div><p className="text-xs uppercase tracking-[.18em] text-gold">{viewing.staff_categories?.name || viewing.role_title || "Team member"}</p><p className="mt-4 leading-7 text-black/60">{viewing.bio || "No biography added."}</p><p className="mt-5 text-sm">GHS {(viewing.base_price_minor / 100).toFixed(2)} · {viewing.pricing_type}</p></div></div></Modal>}
  </>;
}

function StaffForm({ categories, member }: { categories: Category[]; member?: StaffMember }) {
  return <ActionForm action={saveStaffMember} successMessage={member ? "Staff member saved." : "Staff member added."} className="grid gap-4">
    <input type="hidden" name="id" value={member?.id || ""} />
    <input type="hidden" name="current_profile_photo_url" value={member?.profile_photo_url || ""} />
    <div className="grid gap-4 sm:grid-cols-2"><TextField name="name" label="Name" value={member?.name} required /><TextField name="slug" label="Slug (optional)" value={member?.slug} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><Select name="category_id" label="Category" value={member?.category_id || ""} options={categories.map(x => [x.id, x.name])} /><TextField name="role_title" label="Role title" value={member?.role_title} /></div>
    <label className="text-sm"><span className="mb-2 block">Profile photo</span><input name="profile_photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full border border-black/15 bg-white p-3" /><span className="mt-2 block text-xs text-black/55">JPG, PNG, WebP, or GIF. Maximum 8 MB.</span></label>
    <TextArea name="bio" label="Bio" value={member?.bio} />
    <div className="grid gap-4 sm:grid-cols-2"><TextField name="email" label="Email" type="email" value={member?.email} /><TextField name="phone" label="Phone" value={member?.phone} /></div>
    <div className="grid gap-4 sm:grid-cols-3"><TextField name="base_price" label="Base price (GHS)" type="number" value={member ? member.base_price_minor / 100 : 0} /><Select name="pricing_type" label="Pricing" value={member?.pricing_type || "per_booking"} options={["hourly", "daily", "fixed", "per_booking"].map(x => [x, x])} /><Select name="status" label="Status" value={member?.status || "active"} options={["active", "unavailable", "leave", "archived"].map(x => [x, x])} /></div>
    <label className="text-sm"><input type="checkbox" name="featured" defaultChecked={member?.featured} className="mr-2" />Featured on homepage</label>
    <SaveButton label={member ? "Save changes" : "Add staff member"} />
  </ActionForm>;
}

function Select({ name, label, options, value }: { name: string; label: string; options: string[][]; value?: string }) {
  return <label className="text-sm"><span className="mb-2 block">{label}</span><select name={name} defaultValue={value} className="w-full border border-black/15 bg-white px-3 py-2.5"><option value="">Select…</option>{options.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>;
}
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-4"><section role="dialog" aria-modal="true" className="my-8 w-full max-w-3xl bg-paper p-6"><div className="mb-6 flex items-center justify-between"><h2 className="font-display text-3xl">{title}</h2><button type="button" aria-label="Close" onClick={close}><X /></button></div>{children}</section></div>;
}
function Icon({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-9 place-items-center border border-black/15 transition hover:bg-gold">{children}</button>;
}
