import { requireAdmin } from "@/lib/auth";
import {
  CollectionHeader,
  SaveButton,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import { EquipmentManager } from "@/components/equipment-manager";
import { ActionForm } from "@/components/action-form";
import { saveCategory } from "./actions";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const [{ data: categories, error }, { data: items },{data:rentals}] = await Promise.all([
    supabase.from("equipment_categories").select("*").order("sort_order"),
    supabase
      .from("equipment")
      .select("*,equipment_categories(name)")
      .order("name"),
    supabase.from("equipment_rentals").select("*,equipment(name),profiles(first_name,last_name,email)").order("created_at",{ascending:false}),
  ]);
  if (error) throw new Error(error.message);
  return (
    <>
      <CollectionHeader
        eyebrow="Operations"
        title="Equipment"
        description="View the inventory in a table and edit individual items in a focused modal."
      />
      <details className="mt-8 bg-paper p-6">
        <summary className="cursor-pointer font-display text-2xl">
          Add equipment category
        </summary>
        <ActionForm action={saveCategory} successMessage="Equipment category added." className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value="" />
          <TextField name="name" label="Name" required />
          <TextField name="slug" label="Slug (optional)" />
          <div className="sm:col-span-2">
            <TextArea name="description" label="Description" />
          </div>
          <TextField
            name="sort_order"
            label="Sort order"
            type="number"
            value={0}
          />
          <label className="pt-8 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked
              className="mr-2"
            />
            Active
          </label>
          <div className="sm:col-span-2">
            <SaveButton label="Add category" />
          </div>
        </ActionForm>
      </details>
      <EquipmentManager
        items={items || []}
        categories={(categories || []).map((x) => ({ id: x.id, name: x.name }))}
      />
      <section className="mt-10 bg-paper p-6"><h2 className="font-display text-3xl">Rental tracking</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead><tr className="border-b border-black/10"><th className="p-3">Equipment</th><th className="p-3">Client</th><th className="p-3">Period</th><th className="p-3">Quantity</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead><tbody>{rentals?.length?rentals.map((r)=>{const equipment=Array.isArray(r.equipment)?r.equipment[0]:r.equipment,client=Array.isArray(r.profiles)?r.profiles[0]:r.profiles;return <tr key={r.id} className="border-b border-black/10 hover:bg-white"><td className="p-3 font-medium">{equipment?.name}</td><td className="p-3">{client?.first_name} {client?.last_name}<br/><small>{client?.email}</small></td><td className="p-3">{new Date(r.starts_at).toLocaleDateString()} – {new Date(r.ends_at).toLocaleDateString()}</td><td className="p-3">{r.quantity}</td><td className="p-3">GHS {(r.total_minor/100).toFixed(2)}</td><td className="p-3 capitalize">{r.status.replaceAll("_"," ")}</td></tr>}):<tr><td colSpan={6} className="p-6 text-center text-black/45">No rentals yet.</td></tr>}</tbody></table></div></section>
    </>
  );
}
