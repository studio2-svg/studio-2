/* eslint-disable @next/next/no-img-element */
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
export default async function BookPage() {
  await connection();
  const { supabase } = await requireUser();
  const [{ data: studios }, { data: purposes }, { data: equipment }, { data: studioImages }, { data: staff }] =
    await Promise.all([
      supabase
        .from("studios")
        .select("id,name,currency,description,cover_image_url")
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
        .from("staff_members")
        .select("id,name,role_title,profile_photo_url,base_price_minor,pricing_type,staff_categories(name)")
        .eq("status", "active")
        .order("featured", { ascending: false })
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
          <div className="grid gap-4 sm:grid-cols-2">
            {studios?.map((studio) => (
              <label
                key={studio.id}
                className="group cursor-pointer overflow-hidden border border-black/10 bg-white transition hover:border-gold hover:shadow-lg"
              >
                {studio.cover_image_url && (
                  <img
                    src={studio.cover_image_url}
                    alt={studio.name}
                    className="aspect-video w-full object-cover transition group-hover:scale-105"
                  />
                )}
                <span className="grid grid-cols-3 gap-1 p-1">{studioImages?.filter(image=>image.studio_id===studio.id).slice(0,6).map(image=><img key={image.id} src={image.image_url} alt={image.alt_text||studio.name} className="aspect-square w-full object-cover"/>)}</span>
                <span className="block p-4">
                  <input
                    type="radio"
                    name="studio_id"
                    value={studio.id}
                    required
                    className="mr-2"
                  />
                  <strong>{studio.name}</strong>
                  <small className="mt-2 block text-black/50">
                    {studio.description}
                  </small>
                </span>
              </label>
            ))}
          </div>
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
            <p className="mb-4 text-sm text-black/50">Optional team members are checked for availability before checkout.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {staff?.map((person) => (
                <label key={person.id} className="flex cursor-pointer gap-3 border border-black/10 bg-white p-4 transition hover:border-gold hover:shadow-sm">
                  <input type="checkbox" name="staff_ids" value={person.id} className="mt-1" />
                  {person.profile_photo_url && <img src={person.profile_photo_url} alt={person.name} className="size-14 rounded-full object-cover" />}
                  <span><strong className="block">{person.name}</strong><small className="block text-black/50">{person.staff_categories?.[0]?.name || person.role_title || "Production team"}</small><small className="mt-1 block text-black/50">GHS {(person.base_price_minor / 100).toFixed(2)} · {person.pricing_type}</small></span>
                </label>
              ))}
              {!staff?.length && <p className="text-sm text-black/50">No team members are currently available.</p>}
            </div>
          </fieldset>
          <SaveButton label="Proceed to secure checkout" />
        </ActionForm>
      </div>
    </main>
  );
}
