import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import {
  CollectionHeader,
  SaveButton,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import {
  addPurpose,
  saveRecommendation,
  saveStaffCategory,
  saveStaffMember,
} from "./actions";
export default async function StaffAdmin() {
  const { supabase } = await requireAdmin();
  const [
    { data: categories },
    { data: members },
    { data: purposes },
    { data: rules },
  ] = await Promise.all([
    supabase.from("staff_categories").select("*").order("sort_order"),
    supabase.from("staff_members").select("*").order("name"),
    supabase.from("booking_purposes").select("*").order("sort_order"),
    supabase
      .from("production_requirement_rules")
      .select("*,booking_purposes(name),staff_categories(name)")
      .order("created_at"),
  ]);
  return (
    <>
      <CollectionHeader
        eyebrow="Operations"
        title="Staff and recommendations"
        description="Manage the production team and configurable project-purpose recommendations."
      />
      <div className="mt-8 grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ActionForm action={saveStaffCategory} successMessage="Staff category added." className="grid gap-4 bg-paper p-6">
            <h2 className="font-display text-2xl">Add staff category</h2>
            <input type="hidden" name="id" value="" />
            <TextField name="name" label="Name" required />
            <TextField name="slug" label="Slug (optional)" />
            <TextArea name="description" label="Description" />
            <TextField
              name="sort_order"
              label="Sort order"
              type="number"
              value={0}
            />
            <label className="text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked
                className="mr-2"
              />
              Active
            </label>
            <SaveButton />
          </ActionForm>
          <ActionForm action={addPurpose} successMessage="Booking purpose added." className="grid gap-4 bg-paper p-6">
            <h2 className="font-display text-2xl">Add booking purpose</h2>
            <TextField name="name" label="Name" required />
            <TextField name="slug" label="Slug (optional)" />
            <TextArea name="description" label="Description" />
            <TextField
              name="sort_order"
              label="Sort order"
              type="number"
              value={0}
            />
            <SaveButton />
          </ActionForm>
        </div>
        <StaffForm categories={categories || []} />
        <div className="space-y-4">
          {members?.map((member) => (
            <StaffForm
              key={member.id}
              member={member}
              categories={categories || []}
            />
          ))}
        </div>
        <section className="bg-paper p-6">
          <h2 className="font-display text-2xl">Production recommendations</h2>
          <ActionForm
            action={saveRecommendation}
            successMessage="Recommendation saved."
            className="mt-5 grid gap-4 sm:grid-cols-3"
          >
            <Select
              name="purpose_id"
              label="Purpose"
              options={(purposes || []).map((x) => [x.id, x.name])}
            />
            <Select
              name="staff_category_id"
              label="Staff category"
              options={(categories || []).map((x) => [x.id, x.name])}
            />
            <TextField
              name="recommended_quantity"
              label="Recommended"
              type="number"
              value={1}
            />
            <TextField
              name="minimum_quantity"
              label="Minimum"
              type="number"
              value={0}
            />
            <TextField
              name="maximum_quantity"
              label="Maximum"
              type="number"
              value={1}
            />
            <label className="pt-8 text-sm">
              <input type="checkbox" name="required" className="mr-2" />
              Required
            </label>
            <SaveButton />
          </ActionForm>
          <div className="mt-6 space-y-2">
            {rules?.map((rule) => (
              <p
                key={rule.id}
                className="border-t border-black/10 py-2 text-sm"
              >
                {rule.booking_purposes?.name}: {rule.recommended_quantity} ×{" "}
                {rule.staff_categories?.name}
              </p>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
type Category = { id: string; name: string };
type Member = {
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
};
function StaffForm({
  categories,
  member,
}: {
  categories: Category[];
  member?: Member;
}) {
  return (
    <ActionForm action={saveStaffMember} successMessage={member?"Staff member saved.":"Staff member added."} className="grid gap-4 bg-paper p-6">
      <h2 className="font-display text-2xl">
        {member ? member.name : "Add staff member"}
      </h2>
      <input type="hidden" name="id" value={member?.id || ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name="name" label="Name" value={member?.name} required />
        <TextField
          name="slug"
          label="Slug (optional)"
          value={member?.slug}
        />
        <Select
          name="category_id"
          label="Category"
          value={member?.category_id || ""}
          options={categories.map((x) => [x.id, x.name])}
        />
      </div>
      <TextField
        name="role_title"
        label="Role title"
        value={member?.role_title}
      />
      <input
        type="hidden"
        name="current_profile_photo_url"
        value={member?.profile_photo_url || ""}
      />
      <label className="text-sm">
        <span className="mb-2 block">Profile photo</span>
        <input
          name="profile_photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full border border-black/15 bg-white p-3"
        />
        <span className="mt-2 block text-xs text-black/55">
          JPG, PNG, WebP, or GIF. Maximum 8 MB.
        </span>
      </label>
      <TextArea name="bio" label="Bio" value={member?.bio} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="email"
          label="Email"
          type="email"
          value={member?.email}
        />
        <TextField name="phone" label="Phone" value={member?.phone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="base_price"
          label="Base price (GHS)"
          type="number"
          value={member ? member.base_price_minor / 100 : 0}
        />
        <Select
          name="pricing_type"
          label="Pricing"
          value={member?.pricing_type || "per_booking"}
          options={["hourly", "daily", "fixed", "per_booking"].map((x) => [
            x,
            x,
          ])}
        />
        <Select
          name="status"
          label="Status"
          value={member?.status || "active"}
          options={["active", "unavailable", "leave", "archived"].map((x) => [
            x,
            x,
          ])}
        />
      </div>
      <label className="text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={member?.featured}
          className="mr-2"
        />
        Featured
      </label>
      <SaveButton label={member ? "Save" : "Add staff member"} />
    </ActionForm>
  );
}
function Select({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: string[][];
  value?: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-2 block">{label}</span>
      <select
        name={name}
        defaultValue={value}
        required
        className="w-full border border-black/15 bg-white px-3 py-2.5"
      >
        <option value="">Select…</option>
        {options.map(([id, title]) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
