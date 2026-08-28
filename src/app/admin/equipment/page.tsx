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
import {updateRentalOrder} from "@/app/admin/orders-actions";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const [{ data: categories, error }, { data: items }, { data: rentals }] =
    await Promise.all([
      supabase.from("equipment_categories").select("*").order("sort_order"),
      supabase
        .from("equipment")
        .select("*,equipment_categories(name)")
        .order("name"),
      supabase
        .from("equipment_rentals")
        .select("*,equipment(name),profiles(first_name,last_name,email)")
        .order("created_at", { ascending: false }),
    ]);
  if (error) throw new Error(error.message);
  const{data:rentalPayments}=await supabase.from("payments").select("entity_id,status").eq("entity_type","equipment_rental");
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
        <ActionForm
          action={saveCategory}
          successMessage="Equipment category added."
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
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
      <section className="mt-10 bg-paper p-6">
        <h2 className="font-display text-3xl">Rental tracking</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="p-3">Equipment</th>
                <th className="p-3">Client</th>
                <th className="p-3">Period</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rentals?.length ? (
                rentals.map((r) => {
                  const equipment = Array.isArray(r.equipment)
                      ? r.equipment[0]
                      : r.equipment,
                    client = Array.isArray(r.profiles)
                      ? r.profiles[0]
                      : r.profiles;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-black/10 hover:bg-white"
                    >
                      <td className="p-3 font-medium">{equipment?.name}</td>
                      <td className="p-3">
                        {client?.first_name} {client?.last_name}
                        <br />
                        <small>{client?.email}</small>
                      </td>
                      <td className="p-3">
                        {new Date(r.starts_at).toLocaleDateString()} –{" "}
                        {new Date(r.ends_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">{r.quantity}</td>
                      <td className="p-3">
                        GHS {(r.total_minor / 100).toFixed(2)}
                      </td>
                      <td className="p-3 capitalize">
                        {r.status.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 text-right"><details className="relative inline-block text-left"><summary className="cursor-pointer list-none border border-ink px-3 py-2">Edit</summary><div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4"><div className="my-8 w-full max-w-lg bg-paper p-6 text-left shadow-2xl"><ActionForm action={updateRentalOrder} successMessage="Rental updated." className="grid gap-3"><input type="hidden" name="id" value={r.id}/><TextField name="starts_at" label="Starts" type="datetime-local" value={new Date(r.starts_at).toISOString().slice(0,16)} required/><TextField name="ends_at" label="Ends" type="datetime-local" value={new Date(r.ends_at).toISOString().slice(0,16)} required/><TextField name="quantity" label="Quantity" type="number" value={r.quantity} required/><OrderSelect name="status" label="Rental status" value={r.status} options={["awaiting_payment","paid","ready","collected","returned","cancelled"]}/><OrderSelect name="payment_status" label="Payment status" value={rentalPayments?.find(p=>p.entity_id===r.id)?.status||"pending"} options={["pending","paid","failed","refunded"]}/><SaveButton label="Save rental"/></ActionForm></div></div></details></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-black/45">
                    No rentals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function OrderSelect({name,label,value,options}:{name:string;label:string;value:string;options:string[]}){return <label className="text-sm"><span className="mb-2 block">{label}</span><select name={name} defaultValue={value} className="w-full border border-black/15 bg-white p-3">{options.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>}
