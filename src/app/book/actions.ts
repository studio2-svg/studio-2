"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePaystack, paystackSecret } from "@/lib/paystack";
const schema = z.object({
  studio_id: z.uuid(),
  purpose_id: z.union([z.literal(""), z.uuid()]),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  notes: z.string().trim().max(2000),
});
export async function createBooking(form: FormData) {
  try {
    return await createBookingCheckout(form);
  } catch (error) {
    return { error: checkoutError(error) };
  }
}

async function createBookingCheckout(form: FormData) {
  paystackSecret();
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
  const [
    { data: conflicts },
    { data: blocks },
    { data: studio },
    { data: purpose },
  ] = await Promise.all([
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
      .from("studios")
      .select("name,currency,price_minor,pricing_type")
      .eq("id", input.studio_id)
      .single(),
    input.purpose_id
      ? supabase
          .from("booking_purposes")
          .select("name")
          .eq("id", input.purpose_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (conflicts?.length || blocks?.length)
    throw new Error(
      "That studio is unavailable during the selected time. Please choose another time.",
    );
  const hours = (ends.getTime() - starts.getTime()) / 3600000;
  const equipmentIds = z.array(z.uuid()).parse(form.getAll("equipment_ids"));
  const staffIds = z.array(z.uuid()).parse(form.getAll("staff_ids"));
  const { data: selectedEquipment } = equipmentIds.length
    ? await supabase
        .from("equipment")
        .select("id,name,price_minor,pricing_type")
        .in("id", equipmentIds)
    : { data: [] };
  const { data: selectedStaff } = staffIds.length
    ? await supabase
        .from("staff_members")
        .select("id,name,base_price_minor,pricing_type")
        .in("id", staffIds)
        .eq("status", "active")
    : { data: [] };
  if ((selectedStaff?.length || 0) !== staffIds.length)
    throw new Error(
      "One or more selected team members are no longer available.",
    );
  for (const staffId of staffIds) {
    const { data: available, error: availabilityError } = await supabase.rpc(
      "staff_is_available",
      {
        target_staff: staffId,
        target_start: starts.toISOString(),
        target_end: ends.toISOString(),
      },
    );
    if (availabilityError || !available)
      throw new Error(
        "A selected team member is unavailable at that time. Please choose another person or time.",
      );
  }
  const days = Math.max(1, Math.ceil(hours / 24));
  const studioUnits = studio?.pricing_type === "daily" ? days : studio?.pricing_type === "fixed" ? 1 : Math.ceil(hours);
  const studioTotal = studioUnits * (studio?.price_minor || 0);
  const equipmentTotal = (selectedEquipment || []).reduce(
    (sum, item) =>
      sum +
      item.price_minor *
        (item.pricing_type === "hourly" ? Math.ceil(hours) : 1),
    0,
  );
  const staffTotal = (selectedStaff || []).reduce((sum, person) => {
    const units =
      person.pricing_type === "hourly"
        ? Math.ceil(hours)
        : person.pricing_type === "daily"
          ? days
          : 1;
    return sum + person.base_price_minor * units;
  }, 0);
  const total = studioTotal + equipmentTotal + staffTotal;
  if (total <= 0)
    throw new Error("Pricing has not been configured for this checkout.");
  if (form.get("confirm_checkout") !== "yes") {
    const items = [
      {
        label: studio?.name || "Studio session",
        detail: `${studioUnits} ${studio?.pricing_type || "hourly"} unit${studioUnits === 1 ? "" : "s"}`,
        amountMinor: studioTotal,
      },
      ...(selectedEquipment || []).map((item) => ({
        label: item.name,
        detail: `Equipment · ${item.pricing_type}`,
        amountMinor:
          item.price_minor *
          (item.pricing_type === "hourly" ? Math.ceil(hours) : 1),
      })),
      ...(selectedStaff || []).map((person) => {
        const units =
          person.pricing_type === "hourly"
            ? Math.ceil(hours)
            : person.pricing_type === "daily"
              ? days
              : 1;
        return {
          label: person.name,
          detail: `Production team · ${person.pricing_type}`,
          amountMinor: person.base_price_minor * units,
        };
      }),
    ];
    return {
      review: {
        title: "Studio booking",
        reference: purpose?.name || "General production",
        period: `${starts.toLocaleString("en-GH")} – ${ends.toLocaleString("en-GH")}`,
        currency: studio?.currency || "GHS",
        items,
        totalMinor: total,
      },
    } as const;
  }
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      studio_id: input.studio_id,
      purpose_id: input.purpose_id || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      notes: input.notes || null,
      estimated_amount_minor: total,
    })
    .select("id")
    .single();
  if (error || !booking)
    throw new Error(error?.message || "Booking could not be created.");
  if (selectedEquipment?.length) {
    const { error: equipmentError } = await supabase
      .from("booking_equipment")
      .insert(
        selectedEquipment.map((item) => ({
          booking_id: booking.id,
          equipment_id: item.id,
          quantity: 1,
          amount_minor:
            item.price_minor *
            (item.pricing_type === "hourly" ? Math.ceil(hours) : 1),
        })),
      );
    if (equipmentError) throw new Error(equipmentError.message);
  }
  if (selectedStaff?.length) {
    const admin = createAdminClient();
    const { error: staffError } = await admin.from("staff_assignments").insert(
      selectedStaff.map((person) => ({
        staff_id: person.id,
        booking_reference: booking.id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: "held",
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })),
    );
    if (staffError) throw new Error(staffError.message);
  }
  const reference = `booking-${booking.id}`;
  const paymentAdmin = createAdminClient();
  const { error: paymentError } = await paymentAdmin.from("payments").insert({
    customer_id: user.id,
    entity_type: "booking",
    entity_id: booking.id,
    reference,
    amount_minor: total,
  });
  if (paymentError) throw new Error(paymentError.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/admin/bookings");
  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://studio-2-psi.vercel.app";
  const checkout = await initializePaystack({
    email: user.email!,
    amount: total,
    reference,
    callbackUrl: `${origin}/payment/callback`,
    metadata: { type: "booking", booking_id: booking.id },
  });
  return { redirectTo: checkout.authorization_url };
}

function checkoutError(error: unknown) {
  if (!process.env.PAYSTACK_SECRET_KEY)
    return "Online payment is not configured yet. Add the Paystack secret key in Vercel before checking out.";
  return error instanceof Error
    ? error.message
    : "Checkout could not be started. Please try again.";
}
