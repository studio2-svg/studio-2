import { requireAdmin } from "@/lib/auth";
import { saveTestimonial } from "../content-actions";
import { ActionForm } from "@/components/action-form";
import {
  CollectionHeader,
  SaveButton,
  StatusField,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
const blank = {
  id: "",
  customer_name: "",
  customer_role: "",
  company: "",
  review: "",
  rating: 5,
  profile_image_url: "",
  sort_order: 0,
  status: "draft",
};
export default async function TestimonialsAdmin() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (
    <>
      <CollectionHeader
        eyebrow="Website"
        title="Testimonials"
        description="Manage client reviews and upload customer portraits."
      />
      <Card item={blank} create />
      <div className="mt-8 space-y-4">
        {data?.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
function Card({
  item,
  create = false,
}: {
  item: typeof blank;
  create?: boolean;
}) {
  return (
    <ActionForm action={saveTestimonial} successMessage={create?"Testimonial added.":"Testimonial saved."} className="mt-8 grid gap-4 bg-paper p-6">
      <h2 className="font-display text-2xl">
        {create ? "Add testimonial" : item.customer_name}
      </h2>
      <input type="hidden" name="id" value={item.id} />
      <input
        type="hidden"
        name="current_profile_image_url"
        value={item.profile_image_url || ""}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="customer_name"
          label="Customer name"
          value={item.customer_name}
          required
        />
        <TextField
          name="customer_role"
          label="Role"
          value={item.customer_role}
        />
        <TextField name="company" label="Company" value={item.company} />
      </div>
      <TextArea name="review" label="Review" value={item.review} />
      <label className="text-sm">
        <span className="mb-2 block">Customer image</span>
        <input
          type="file"
          name="profile_image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full border border-black/15 bg-white px-3 py-2.5"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="rating"
          label="Rating (1–5)"
          type="number"
          value={item.rating}
        />
        <TextField
          name="sort_order"
          label="Sort order"
          type="number"
          value={item.sort_order}
        />
        <StatusField value={item.status} />
      </div>
      <SaveButton label={create ? "Add testimonial" : "Save"} />
    </ActionForm>
  );
}
