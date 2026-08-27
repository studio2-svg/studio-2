import Link from "next/link";
import {connection} from "next/server";
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
  const [{ data: studios }, { data: purposes }] = await Promise.all([
    supabase
      .from("studios")
      .select("id,name,currency")
      .eq("active", true)
      .order("name"),
    supabase
      .from("booking_purposes")
      .select("id,name")
      .eq("active", true)
      .order("sort_order"),
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
          <label className="text-sm">
            <span className="mb-2 block">Studio</span>
            <select
              name="studio_id"
              required
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
          <SaveButton label="Submit booking request" />
        </ActionForm>
      </div>
    </main>
  );
}
