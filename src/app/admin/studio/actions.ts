"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/upload-image";
const id = z.uuid(),
  text = (n = 500) => z.string().trim().max(n);
function refresh() {
  revalidatePath("/admin/studio");
  revalidatePath("/studio");
  revalidatePath("/pricing");
}
async function permitted() {
  const session = await requireAdmin();
  if (
    !["admin", "owner"].includes(session.profile.role) &&
    !session.profile.permissions.includes("studio")
  )
    throw new Error("You do not have permission to manage studios.");
  return session;
}
export async function addStudio(form: FormData) {
  const v = z
    .object({
      name: text(120).min(1),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      currency: z.string().length(3),
      timezone: text(80).min(1),
    })
    .parse(Object.fromEntries(form));
  const { supabase } = await permitted();
  const { data, error } = await supabase
    .from("studios")
    .insert({
      name: v.name,
      slug: v.slug,
      currency: v.currency.toUpperCase(),
      timezone: v.timezone,
      active: true,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(error?.message || "Studio could not be created.");
  refresh();
}
export async function saveStudio(form: FormData) {
  const v = z
    .object({
      id,
      name: text(120).min(1),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      description: text(3000),
      address: text(500),
      timezone: text(80).min(1),
      currency: z.string().length(3),
      current_cover_image_url: z.string(),
      featured:z.string().optional(),
      active: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await permitted();
  const cover_image_url = await uploadImage(
    supabase,
    user.id,
    form.get("cover_image"),
    v.current_cover_image_url,
  );
  const { error } = await supabase
    .from("studios")
    .update({
      name: v.name,
      slug: v.slug,
      description: v.description || null,
      address: v.address || null,
      timezone: v.timezone,
      currency: v.currency.toUpperCase(),
      cover_image_url,
      featured:v.featured==="on",
      active: v.active === "on",
    })
    .eq("id", v.id);
  if (error) throw new Error(error.message);
  refresh();
}
export async function deleteStudio(form: FormData) {
  const studioId = id.parse(form.get("id"));
  const { supabase } = await permitted();
  const { count, error: countError } = await supabase
    .from("studios")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) <= 1)
    throw new Error("Keep at least one studio in the system.");
  const { error } = await supabase.from("studios").delete().eq("id", studioId);
  if (error) throw new Error(error.message);
  refresh();
}
export async function saveHours(form: FormData) {
  const v = z
      .object({
        studio_id: id,
        day_of_week: z.coerce.number().int().min(0).max(6),
        is_closed: z.string().optional(),
        opens_at: z.string(),
        closes_at: z.string(),
      })
      .parse(Object.fromEntries(form)),
    closed = v.is_closed === "on";
  if (!closed && (!v.opens_at || !v.closes_at || v.closes_at <= v.opens_at))
    throw new Error("Closing time must be after opening time.");
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("opening_hours")
    .upsert(
      {
        studio_id: v.studio_id,
        day_of_week: v.day_of_week,
        is_closed: closed,
        opens_at: closed ? null : v.opens_at,
        closes_at: closed ? null : v.closes_at,
      },
      { onConflict: "studio_id,day_of_week" },
    );
  if (error) throw new Error(error.message);
  refresh();
}
export async function saveBookingRules(form: FormData) {
  const v = z
    .object({
      studio_id: id,
      minimum_duration_minutes: z.coerce.number().int().positive(),
      maximum_duration_minutes: z.coerce.number().int().positive(),
      booking_increment_minutes: z.coerce.number().int().positive(),
      minimum_notice_hours: z.coerce.number().int().min(0),
      maximum_advance_days: z.coerce.number().int().positive(),
      hold_duration_minutes: z.coerce.number().int().min(5).max(120),
      cancellation_policy: text(5000),
    })
    .parse(Object.fromEntries(form));
  if (v.maximum_duration_minutes < v.minimum_duration_minutes)
    throw new Error("Maximum duration must be greater than the minimum.");
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("booking_rules")
    .upsert(v, { onConflict: "studio_id" });
  if (error) throw new Error(error.message);
  refresh();
}
export async function addBlockedPeriod(form: FormData) {
  const v = z
    .object({
      studio_id: id,
      starts_at: z.string().min(1),
      ends_at: z.string().min(1),
      reason: text(300).min(1),
      internal_notes: text(1000),
    })
    .parse(Object.fromEntries(form));
  const { user, supabase } = await permitted(),
    starts = new Date(v.starts_at);
  let ends = new Date(v.ends_at);
  if (Number.isNaN(starts.valueOf()) || Number.isNaN(ends.valueOf()))
    throw new Error("Choose valid start and end dates.");
  if (ends <= starts && v.ends_at.slice(0, 10) === v.starts_at.slice(0, 10))
    ends = new Date(starts.getTime() + 86400000);
  if (ends <= starts)
    throw new Error("The end date cannot be before the start date.");
  const { error } = await supabase
    .from("blocked_periods")
    .insert({
      studio_id: v.studio_id,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      reason: v.reason,
      internal_notes: v.internal_notes || null,
      created_by: user.id,
    });
  if (error) throw new Error(error.message);
  refresh();
}
export async function addPricingRule(form: FormData) {
  const v = z
    .object({
      studio_id: id,
      name: text(160).min(1),
      rule_type: z.enum([
        "hourly",
        "fixed",
        "tiered",
        "percentage",
        "flat_fee",
      ]),
      amount: z.coerce.number().min(0),
      priority: z.coerce.number().int(),
      active: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("pricing_rules")
    .insert({
      studio_id: v.studio_id,
      name: v.name,
      rule_type: v.rule_type,
      amount_minor: Math.round(v.amount * 100),
      priority: v.priority,
      active: v.active === "on",
    });
  if (error) throw new Error(error.message);
  refresh();
}
export async function updatePricingRule(form:FormData){const v=z.object({id,studio_id:id,name:text(160).min(1),rule_type:z.enum(["hourly","fixed","tiered","percentage","flat_fee"]),amount:z.coerce.number().min(0),priority:z.coerce.number().int(),active:z.string().optional()}).parse(Object.fromEntries(form));const{supabase}=await permitted();const{error}=await supabase.from("pricing_rules").update({name:v.name,rule_type:v.rule_type,amount_minor:Math.round(v.amount*100),priority:v.priority,active:v.active==="on"}).eq("id",v.id).eq("studio_id",v.studio_id);if(error)throw new Error(error.message);refresh()}
export async function deletePricingRule(form:FormData){const ruleId=id.parse(form.get("id"));const{supabase}=await permitted();const{error}=await supabase.from("pricing_rules").delete().eq("id",ruleId);if(error)throw new Error(error.message);refresh()}
export async function addStudioImages(form:FormData){const studioId=id.parse(form.get("studio_id"));const{supabase,user}=await permitted();const files=form.getAll("images").filter((entry):entry is File=>entry instanceof File&&entry.size>0);if(!files.length)throw new Error("Choose at least one studio image.");if(files.length>12)throw new Error("Upload no more than 12 images at once.");const rows=[];for(const file of files){const image_url=await uploadImage(supabase,user.id,file,"");if(image_url)rows.push({studio_id:studioId,image_url,alt_text:"Studio photo"})}const{error}=await supabase.from("studio_images").insert(rows);if(error)throw new Error(error.message);refresh()}
export async function deleteStudioImage(form:FormData){const imageId=id.parse(form.get("id"));const{supabase}=await permitted();const{error}=await supabase.from("studio_images").delete().eq("id",imageId);if(error)throw new Error(error.message);refresh()}
