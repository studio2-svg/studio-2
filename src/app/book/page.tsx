import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import {
  SaveButton,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import { createBooking } from "./actions";
import { StudioBookingPicker } from "@/components/studio-booking-picker";
export default async function BookPage() {
  await connection();
  const { supabase } = await requireUser();
  const [{ data: studios }, { data: purposes }, { data: equipment }, { data: studioImages }, { data: staffCategories }] =
    await Promise.all([
      supabase
        .from("studios")
        .select("id,name,currency,description,cover_image_url,price_minor,pricing_type")
        .eq("active", true)
        .order("name"),
      supabase
        .from("booking_purposes")
        .select("id,name")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("equipment")
        .select("id,name,price_minor,pricing_type,total_quantity,image_url")
        .eq("status", "available")
        .order("name"),
      supabase.from("studio_images").select("id,studio_id,image_url,alt_text").order("sort_order"),
      supabase
        .from("staff_categories")
        .select("id,name,description,staff_members(id)")
        .eq("active", true)
        .order("sort_order")
        .order("name"),
    ]);
  return (
    <main className="min-h-screen bg-[#ebe7de] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/bookings"
          className="text-sm text-black/50 hover:text-ink"
        >
          ← Back to bookings
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[.25em] text-gold">
          Client booking
        </p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">
          Book your studio.
        </h1>
        <p className="mt-4 text-black/55">
          Choose a studio and your production time. Your request will appear in
          your dashboard immediately.
        </p>
        <ActionForm
          action={createBooking}
          successMessage="Booking request submitted. You can now view it in your dashboard."
          className="mt-10 grid gap-5 bg-paper p-6 sm:p-8"
        >
          <StudioBookingPicker studios={studios || []} studioImages={studioImages || []} />
          <label className="hidden text-sm">
            <span className="mb-2 block">Studio</span>
            <select
              name="legacy_studio_id"
              className="w-full border border-black/15 bg-white px-4 py-3"
            >
              <option value="">Choose a studio</option>
              {studios?.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name} · {studio.currency}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-2 block">Production type</span>
            <select
              name="purpose_id"
              className="w-full border border-black/15 bg-white px-4 py-3"
            >
              <option value="">General production</option>
              {purposes?.map((purpose) => (
                <option key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="starts_at"
              label="Start"
              type="datetime-local"
              required
            />
            <TextField
              name="ends_at"
              label="End"
              type="datetime-local"
              required
            />
          </div>
          <TextArea name="notes" label="Project notes" rows={5} />
          <fieldset>
            <legend className="mb-3 font-display text-2xl">
              Add equipment
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {equipment?.map((item) => (
                <label
                  key={item.id}
                  className="flex gap-3 border border-black/10 bg-white p-4 transition hover:border-gold"
                >
                  <input type="checkbox" name="equipment_ids" value={item.id} />
                  <span>
                    <strong>{item.name}</strong>
                    <small className="block text-black/50">
                      {item.total_quantity} available · GHS{" "}
                      {(item.price_minor / 100).toFixed(2)} {item.pricing_type}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-display text-2xl">Choose your production team</legend>
            <p className="mb-4 text-sm text-black/50">Choose each profession and the number of professionals you need. Specific team members are assigned automatically based on availability.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {staffCategories?.map((category) => {
                const available = category.staff_members?.length || 0;
                return <label key={category.id} className="border border-black/10 bg-white p-4 transition hover:border-gold hover:shadow-sm">
                  <strong className="block">{category.name}</strong>
                  {category.description && <small className="mt-1 block text-black/50">{category.description}</small>}
                  <span className="mt-3 flex items-center justify-between gap-4">
                    <small className="text-black/50">{available} professional{available === 1 ? "" : "s"} available</small>
                    <span className="flex items-center gap-2 text-sm"><span>Quantity</span><input type="number" name={`staff_category_${category.id}`} min={0} max={available} defaultValue={0} disabled={!available} className="w-20 border border-black/15 px-3 py-2" /></span>
                  </span>
                </label>;
              })}
              {!staffCategories?.length && <p className="text-sm text-black/50">No production professions are currently available.</p>}
            </div>
          </fieldset>
          <SaveButton label="Proceed to secure checkout" />
        </ActionForm>
      </div>
    </main>
  );
}
