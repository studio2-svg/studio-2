import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import {
  CollectionHeader,
  SaveButton,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import { StudiosManager } from "@/components/studios-manager";
import { PricingRulesManager } from "@/components/pricing-rules-manager";
import {
  addBlockedPeriod,
  addPricingRule,
  addStudioImages,
  deleteStudioImage,
  saveBookingRules,
  saveHours,
  updateBlockedPeriod,
} from "./actions";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export default async function StudioAdmin({
  searchParams,
}: PageProps<"/admin/studio">) {
  const { supabase } = await requireAdmin(),
    query = await searchParams;
  const { data: studios, error } = await supabase
    .from("studios")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);
  const requested = typeof query.studio === "string" ? query.studio : null,
    studio = studios?.find((x) => x.id === requested) || studios?.[0];
  return (
    <>
      <CollectionHeader
        eyebrow="Operations"
        title="Studios and pricing"
        description="View studios in one place. Each studio has independent availability, booking rules, and pricing."
      />
      <StudiosManager studios={studios ?? []} selectedId={studio?.id} />
      {studio ? (
        <Configuration studio={studio} supabase={supabase} />
      ) : (
        <p className="mt-8 bg-paper p-6">Create your first studio to begin.</p>
      )}
    </>
  );
}
async function Configuration({
  studio,
  supabase,
}: {
  studio: Record<string, any>;
  supabase: any;
}) {
  const [
    { data: hours },
    { data: blocks },
    { data: prices },
    { data: rules },
    { data: images },
  ] = await Promise.all([
    supabase
      .from("opening_hours")
      .select("*")
      .eq("studio_id", studio.id)
      .order("day_of_week"),
    supabase
      .from("blocked_periods")
      .select("*")
      .eq("studio_id", studio.id)
      .order("starts_at"),
    supabase
      .from("pricing_rules")
      .select("*")
      .eq("studio_id", studio.id)
      .order("priority"),
    supabase
      .from("booking_rules")
      .select("*")
      .eq("studio_id", studio.id)
      .maybeSingle(),
    supabase
      .from("studio_images")
      .select("*")
      .eq("studio_id", studio.id)
      .order("sort_order"),
  ]);
  return (
    <div className="mt-8 grid gap-8">
      <div className="border-l-4 border-gold bg-ink p-5 text-paper transition hover:translate-x-1">
        <p className="text-xs uppercase tracking-[.2em] text-gold">
          Currently viewing
        </p>
        <h2 className="mt-1 font-display text-3xl">{studio.name}</h2>
      </div>
      <section className="bg-paper p-6">
        <h2 className="font-display text-2xl">
          Studio gallery · {studio.name}
        </h2>
        <p className="mt-2 text-sm text-black/50">
          Upload several photos so clients can tour the studio before booking.
        </p>
        <ActionForm
          action={addStudioImages}
          successMessage="Studio images uploaded."
          className="mt-5 flex flex-wrap items-end gap-4"
        >
          <input type="hidden" name="studio_id" value={studio.id} />
          <label className="min-w-64 flex-1 text-sm">
            <span className="mb-2 block">Studio images</span>
            <input
              name="images"
              type="file"
              multiple
              required
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full border border-black/15 bg-white p-3"
            />
          </label>
          <SaveButton label="Upload images" />
        </ActionForm>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images?.map((image: any) => (
            <article
              key={image.id}
              className="group relative overflow-hidden bg-black/5"
            >
              <img
                src={image.image_url}
                alt={image.alt_text || studio.name}
                className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <ActionForm
                action={deleteStudioImage}
                successMessage="Studio image deleted."
                className="absolute right-2 top-2"
              >
                <input type="hidden" name="id" value={image.id} />
                <button className="bg-black px-3 py-2 text-xs text-white">
                  Delete
                </button>
              </ActionForm>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-paper p-6">
        <h2 className="font-display text-2xl">
          Operating hours · {studio.name}
        </h2>
        <div className="mt-5 grid gap-3">
          {days.map((day, index) => {
            const item = hours?.find((row: any) => row.day_of_week === index);
            return (
              <ActionForm
                action={saveHours}
                successMessage={`${day} hours saved.`}
                key={day}
                className="grid items-end gap-3 border-t border-black/10 pt-3 transition hover:bg-white sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
              >
                <input type="hidden" name="studio_id" value={studio.id} />
                <input type="hidden" name="day_of_week" value={index} />
                <strong className="pb-3 text-sm">{day}</strong>
                <TextField
                  name="opens_at"
                  label="Opens"
                  type="time"
                  value={item?.opens_at?.slice(0, 5) || "09:00"}
                />
                <TextField
                  name="closes_at"
                  label="Closes"
                  type="time"
                  value={item?.closes_at?.slice(0, 5) || "18:00"}
                />
                <label className="pb-3 text-sm">
                  <input
                    type="checkbox"
                    name="is_closed"
                    defaultChecked={item?.is_closed}
                    className="mr-2"
                  />
                  Closed
                </label>
                <SaveButton />
              </ActionForm>
            );
          })}
        </div>
      </section>
      <ActionForm
        action={saveBookingRules}
        successMessage="Booking rules saved."
        className="grid gap-4 bg-paper p-6"
      >
        <h2 className="font-display text-2xl">Booking rules · {studio.name}</h2>
        <input type="hidden" name="studio_id" value={studio.id} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            name="minimum_duration_minutes"
            label="Minimum duration (minutes)"
            type="number"
            value={rules?.minimum_duration_minutes || 60}
          />
          <TextField
            name="maximum_duration_minutes"
            label="Maximum duration (minutes)"
            type="number"
            value={rules?.maximum_duration_minutes || 720}
          />
          <TextField
            name="booking_increment_minutes"
            label="Increment (minutes)"
            type="number"
            value={rules?.booking_increment_minutes || 30}
          />
          <TextField
            name="minimum_notice_hours"
            label="Minimum notice (hours)"
            type="number"
            value={rules?.minimum_notice_hours || 24}
          />
          <TextField
            name="maximum_advance_days"
            label="Maximum advance (days)"
            type="number"
            value={rules?.maximum_advance_days || 365}
          />
          <TextField
            name="hold_duration_minutes"
            label="Hold duration (minutes)"
            type="number"
            value={rules?.hold_duration_minutes || 15}
          />
        </div>
        <TextArea
          name="cancellation_policy"
          label="Cancellation policy"
          value={rules?.cancellation_policy}
        />
        <SaveButton />
      </ActionForm>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="bg-paper p-6">
          <h2 className="font-display text-2xl">Blocked periods</h2>
          <ActionForm
            action={addBlockedPeriod}
            successMessage="Period blocked successfully."
            className="mt-5 grid gap-4"
          >
            <input type="hidden" name="studio_id" value={studio.id} />
            <TextField
              name="starts_at"
              label="Starts"
              type="datetime-local"
              required
            />
            <TextField
              name="ends_at"
              label="Ends"
              type="datetime-local"
              required
            />
            <TextField name="reason" label="Reason" required />
            <TextArea name="internal_notes" label="Internal notes" />
            <SaveButton label="Block period" />
          </ActionForm>
          <div className="mt-6 space-y-3">
            {blocks?.map((block: any) => (
              <details key={block.id} className="border-t border-black/10 p-3 text-sm transition hover:bg-white">
                <summary className="cursor-pointer list-none"><span className="flex items-center justify-between gap-4"><span><strong className="block">{block.reason}</strong><span className="text-black/50">{new Date(block.starts_at).toLocaleString()} – {new Date(block.ends_at).toLocaleString()}</span></span><span className="text-xs uppercase tracking-[.14em] text-gold">Edit</span></span></summary>
                <ActionForm action={updateBlockedPeriod} successMessage="Blocked period updated." className="mt-4 grid gap-3 border-t border-black/10 pt-4">
                  <input type="hidden" name="id" value={block.id} />
                  <input type="hidden" name="studio_id" value={studio.id} />
                  <TextField name="starts_at" label="Starts" type="datetime-local" value={new Date(block.starts_at).toISOString().slice(0,16)} required />
                  <TextField name="ends_at" label="Ends" type="datetime-local" value={new Date(block.ends_at).toISOString().slice(0,16)} required />
                  <TextField name="reason" label="Reason" value={block.reason} required />
                  <TextArea name="internal_notes" label="Internal notes" value={block.internal_notes} />
                  <SaveButton label="Save blocked period" />
                </ActionForm>
              </details>
            ))}
          </div>
        </section>
        <section className="bg-paper p-6">
          <h2 className="font-display text-2xl">Pricing · {studio.name}</h2>
          <p className="mt-2 text-sm text-black/50">
            Rules here apply only to this studio.
          </p>
          <ActionForm
            action={addPricingRule}
            successMessage="Pricing rule added."
            className="mt-5 grid gap-4"
          >
            <input type="hidden" name="studio_id" value={studio.id} />
            <TextField name="name" label="Rule name" required />
            <label className="text-sm">
              <span className="mb-2 block">Type</span>
              <select
                name="rule_type"
                className="w-full border border-black/15 bg-white px-3 py-2.5"
              >
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
                <option value="tiered">Tiered</option>
                <option value="percentage">Percentage</option>
                <option value="flat_fee">Flat fee</option>
              </select>
            </label>
            <TextField
              name="amount"
              label={`Amount (${studio.currency})`}
              type="number"
              value={0}
            />
            <TextField
              name="priority"
              label="Priority"
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
            <SaveButton label="Add pricing rule" />
          </ActionForm>
          <PricingRulesManager
            rules={prices || []}
            currency={studio.currency}
          />
        </section>
      </div>
    </div>
  );
}
