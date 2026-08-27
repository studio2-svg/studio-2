"use server";
import { revalidatePath } from "next/cache";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {initializePaystack,paystackSecret} from "@/lib/paystack";
const schema = z.object({
  studio_id: z.uuid(),
  purpose_id: z.union([z.literal(""), z.uuid()]),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  notes: z.string().trim().max(2000),
});
export async function createBooking(form: FormData) {
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
  const equipmentIds=z.array(z.uuid()).parse(form.getAll("equipment_ids"));
  const{data:selectedEquipment}=equipmentIds.length?await supabase.from("equipment").select("id,price_minor,pricing_type").in("id",equipmentIds):{data:[]};
  const studioTotal=Math.round(hours*(price?.amount_minor||0));
  const equipmentTotal=(selectedEquipment||[]).reduce((sum,item)=>sum+item.price_minor*(item.pricing_type==="hourly"?Math.ceil(hours):1),0);
  const total=studioTotal+equipmentTotal;if(total<=0)throw new Error("Pricing has not been configured for this checkout.");
  const { data:booking,error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      studio_id: input.studio_id,
      purpose_id: input.purpose_id || null,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      notes: input.notes || null,
      estimated_amount_minor: total,
    }).select("id").single();
  if (error||!booking) throw new Error(error?.message||"Booking could not be created.");
  if(selectedEquipment?.length){const{error:equipmentError}=await supabase.from("booking_equipment").insert(selectedEquipment.map(item=>({booking_id:booking.id,equipment_id:item.id,quantity:1,amount_minor:item.price_minor*(item.pricing_type==="hourly"?Math.ceil(hours):1)})));if(equipmentError)throw new Error(equipmentError.message)}
  const reference=`booking-${booking.id}`;await supabase.from("payments").insert({customer_id:user.id,entity_type:"booking",entity_id:booking.id,reference,amount_minor:total});
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/admin/bookings");
  const origin=(await headers()).get("origin")||process.env.NEXT_PUBLIC_SITE_URL||"https://studio-2-psi.vercel.app";const checkout=await initializePaystack({email:user.email!,amount:total,reference,callbackUrl:`${origin}/payment/callback`,metadata:{type:"booking",booking_id:booking.id}});redirect(checkout.authorization_url);
}
