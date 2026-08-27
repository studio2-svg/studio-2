import { requireAdmin } from "@/lib/auth";
import { saveNavigationItem } from "../content-actions";
import { ActionForm } from "@/components/action-form";
import {
  CollectionHeader,
  SaveButton,
  StatusField,
  TextField,
} from "@/components/admin-form-fields";
const blank = {
  id: "",
  label: "",
  url: "/",
  sort_order: 0,
  is_visible: true,
  opens_new_tab: false,
  status: "draft",
};
export default async function NavigationAdmin() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("navigation_items")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (
    <>
      <CollectionHeader
        eyebrow="Website"
        title="Navigation"
        description="Control public navigation labels, links, order, and visibility."
      />
      <NavForm item={blank} create />
      <div className="mt-8 space-y-4">
        {data?.map((item) => (
          <NavForm key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
function NavForm({
  item,
  create = false,
}: {
  item: typeof blank;
  create?: boolean;
}) {
  return (
    <ActionForm action={saveNavigationItem} successMessage={create?"Navigation item added.":"Navigation item saved."} className="mt-8 grid gap-4 bg-paper p-6">
      <h2 className="font-display text-2xl">
        {create ? "Add navigation item" : item.label}
      </h2>
      <input type="hidden" name="id" value={item.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="label" label="Label" value={item.label} required />
        <TextField name="url" label="URL" value={item.url} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="sort_order"
          label="Sort order"
          type="number"
          value={item.sort_order}
        />
        <StatusField value={item.status} />
      </div>
      <div className="flex gap-6 text-sm">
        <label>
          <input
            type="checkbox"
            name="is_visible"
            defaultChecked={item.is_visible}
            className="mr-2"
          />
          Visible
        </label>
        <label>
          <input
            type="checkbox"
            name="opens_new_tab"
            defaultChecked={item.opens_new_tab}
            className="mr-2"
          />
          Open in new tab
        </label>
      </div>
      <SaveButton label={create ? "Add link" : "Save"} />
    </ActionForm>
  );
}
