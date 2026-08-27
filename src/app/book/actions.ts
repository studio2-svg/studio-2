"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
const schema = z.object({
  studio_id: z.uuid(),
  purpose_id: z.union([z.literal(""), z.uuid()]),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  notes: z.string().trim().max(2000),
});
export async function createBooking(form: FormData) {
  const input = schema.parse(Object.fromEntries(form));
  const starts = new Date(input.starts_at),
    ends = new Date(input.ends_at);
  if (
    Number.isNaN(starts.valueOf()) ||
    Number.isNaN(ends.valueOf()) ||
    ends <= starts
  )
    throw new Error("Choose a valid start and end time.");
  if (starts <= new Date())
    throw new Error("Bookings must start in the future.");
  const { supabase, user } = await requireUser();
  const [{ data: conflicts }, { data: blocks }, { data: price }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id")
        .eq("studio_id", input.studio_id)
        .in("status", ["pending", "confirmed"])
        .lt("starts_at", ends.toISOString())
        .gt("ends_at", starts.toISOString())
        .limit(1),
      supabase
        .from("blocked_periods")
        .select("id")
        .eq("studio_id", input.studio_id)
        .lt("starts_at", ends.toISOString())
        .gt("ends_at", starts.toISOString())
        .limit(1),
      supabase
        .from("pricing_rules")
        .select("amount_minor")
        .eq("studio_id", input.studio_id)
        .eq("active", true)
        .eq("rule_type", "hourly")
        .order("priority")
        .limit(1)
        .maybeSingle(),
    ]);
  if (conflicts?.length || blocks?.length)
    throw new Error(
      "That studio is unavailable during the selected time. Please choose another time.",
    );
  const hours = (ends.getTime() - starts.getTime()) / 3600000;
  const { error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      studio_id: input.studio_id,
      purpose_id: input.purpose_id || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      notes: input.notes || null,
      estimated_amount_minor: Math.round(hours * (price?.amount_minor || 0)),
    });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/admin/bookings");
}
