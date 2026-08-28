import { createAdminClient } from "@/lib/supabase/admin";

export type PaystackTransaction = { status: string; amount: number; currency: string; paid_at: string; reference?: string; metadata?: Record<string, unknown> };

export async function recordSuccessfulPayment(reference: string, transaction: PaystackTransaction) {
  const admin = createAdminClient();
  const { data: payment, error: findError } = await admin.from("payments").select("*").eq("reference", reference).maybeSingle();
  if (findError) throw new Error(`Payment lookup failed: ${findError.message}`);
  if (!payment) throw new Error("No local payment record matches this transaction.");
  if (transaction.status !== "success" || transaction.amount !== payment.amount_minor || transaction.currency !== payment.currency)
    throw new Error("Paystack transaction details do not match the order.");
  const { error: paymentError } = await admin.from("payments").update({ status: "paid", paid_at: transaction.paid_at || new Date().toISOString(), provider_response: transaction }).eq("id", payment.id);
  if (paymentError) throw new Error(`Payment update failed: ${paymentError.message}`);
  if (payment.entity_type === "booking") {
    const { error } = await admin.from("bookings").update({ status: "confirmed" }).eq("id", payment.entity_id);
    if (error) throw new Error(`Booking update failed: ${error.message}`);
    const { error: staffError } = await admin.from("staff_assignments").update({ status: "confirmed", expires_at: null }).eq("booking_reference", payment.entity_id).eq("status", "held");
    if (staffError) throw new Error(`Staff assignment update failed: ${staffError.message}`);
  } else {
    const { error } = await admin.from("equipment_rentals").update({ status: "paid" }).eq("id", payment.entity_id);
    if (error) throw new Error(`Rental update failed: ${error.message}`);
  }
  return payment;
}
