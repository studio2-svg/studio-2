import { requireAdmin } from "@/lib/auth";
type AdminSupabase=Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type InvoicePayment={entity_type:string;entity_id:string};
export async function invoiceOrderLabel(supabase: AdminSupabase, payment: InvoicePayment) {
  if (payment.entity_type === "booking") {
    const { data } = await supabase
      .from("bookings")
      .select("studios(name),starts_at")
      .eq("id", payment.entity_id)
      .maybeSingle();
    const studio = Array.isArray(data?.studios)
      ? data.studios[0]
      : data?.studios;
    return `${studio?.name || "Studio booking"} · ${data?.starts_at ? new Date(data.starts_at).toLocaleDateString() : ""}`;
  }
  const { data } = await supabase
    .from("equipment_rentals")
    .select("equipment(name),starts_at")
    .eq("id", payment.entity_id)
    .maybeSingle();
  const equipment = Array.isArray(data?.equipment)
    ? data.equipment[0]
    : data?.equipment;
  return `${equipment?.name || "Equipment rental"} · ${data?.starts_at ? new Date(data.starts_at).toLocaleDateString() : ""}`;
}
