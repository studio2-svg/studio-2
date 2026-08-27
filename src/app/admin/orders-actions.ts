"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
const id = z.uuid(),
  paymentStatus = z.enum(["pending", "paid", "failed", "refunded"]);
type AdminSupabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
function dates(startsValue: string, endsValue: string) {
  const starts = new Date(startsValue),
    ends = new Date(endsValue);
  if (
    Number.isNaN(starts.valueOf()) ||
    Number.isNaN(ends.valueOf()) ||
    ends <= starts
  )
    throw new Error("Choose a valid start and end period.");
  return { starts, ends };
}
async function updatePayment(
  supabase: AdminSupabase,
  entityType: string,
  entityId: string,
  status: z.infer<typeof paymentStatus>,
) {
  const values: { status: z.infer<typeof paymentStatus>; paid_at: string | null } = {
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  };
  const { error } = await supabase
    .from("payments")
    .update(values)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw new Error(error.message);
}
export async function updateBookingOrder(form: FormData) {
  const v = z
    .object({
      id,
      starts_at: z.string(),
      ends_at: z.string(),
      status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      payment_status: paymentStatus,
    })
    .parse(Object.fromEntries(form));
  const { starts, ends } = dates(v.starts_at, v.ends_at),
    { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      status: v.status,
    })
    .eq("id", v.id);
  if (error) throw new Error(error.message);
  await updatePayment(supabase, "booking", v.id, v.payment_status);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/invoices");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/invoices");
}
export async function updateRentalOrder(form: FormData) {
  const v = z
    .object({
      id,
      starts_at: z.string(),
      ends_at: z.string(),
      quantity: z.coerce.number().int().positive(),
      status: z.enum([
        "awaiting_payment",
        "paid",
        "ready",
        "collected",
        "returned",
        "cancelled",
      ]),
      payment_status: paymentStatus,
    })
    .parse(Object.fromEntries(form));
  const { starts, ends } = dates(v.starts_at, v.ends_at),
    { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("equipment_rentals")
    .update({
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      quantity: v.quantity,
      status: v.status,
    })
    .eq("id", v.id);
  if (error) throw new Error(error.message);
  await updatePayment(supabase, "equipment_rental", v.id, v.payment_status);
  revalidatePath("/admin/equipment");
  revalidatePath("/admin/invoices");
  revalidatePath("/dashboard/rentals");
  revalidatePath("/dashboard/invoices");
}
