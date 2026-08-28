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
  revalidatePath("/book");
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
      slug: text(160),
      currency: z.string().length(3),
      timezone: text(80).min(1),
      price: z.coerce.number().min(0),
      pricing_type: z.enum(["hourly", "daily", "fixed"]),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await permitted();
  const slug = await uniqueStudioSlug(supabase, v.slug || v.name);
  const { data, error } = await supabase
    .from("studios")
    .insert({
      name: v.name,
      slug,
      currency: v.currency.toUpperCase(),
      timezone: v.timezone,
      price_minor: Math.round(v.price * 100),
      pricing_type: v.pricing_type,
      active: true,
    })
    .select("id")
    .single();
  if (error || !data)
    throw new Error(error?.message || "Studio could not be created.");
  await uploadStudioImages(supabase, user.id, data.id, form.getAll("images"), true);
  refresh();
}
export async function saveStudio(form: FormData) {
  const v = z
    .object({
      id,
      name: text(120).min(1),
      slug: text(160),
      description: text(3000),
      address: text(500),
      timezone: text(80).min(1),
      currency: z.string().length(3),
      price: z.coerce.number().min(0),
      pricing_type: z.enum(["hourly", "daily", "fixed"]),
      featured: z.string().optional(),
      active: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await permitted();
  const slug = await uniqueStudioSlug(supabase, v.slug || v.name, v.id);
  const cover_image_url = await uploadStudioImages(supabase, user.id, v.id, form.getAll("images"), true);
  const { error } = await supabase
    .from("studios")
    .update({
      name: v.name,
      slug,
      description: v.description || null,
      address: v.address || null,
      timezone: v.timezone,
      currency: v.currency.toUpperCase(),
      price_minor: Math.round(v.price * 100),
      pricing_type: v.pricing_type,
      ...(cover_image_url ? { cover_image_url } : {}),
      featured: v.featured === "on",
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
  const { error } = await supabase.from("opening_hours").upsert(
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
  const { error } = await supabase.from("blocked_periods").insert({
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
export async function updateBlockedPeriod(form: FormData) {
  const v = z
    .object({
      id,
      studio_id: id,
      starts_at: z.string().min(1),
      ends_at: z.string().min(1),
      reason: text(300).min(1),
      internal_notes: text(1000),
    })
    .parse(Object.fromEntries(form));
  const starts = new Date(v.starts_at),
    ends = new Date(v.ends_at);
  if (
    Number.isNaN(starts.valueOf()) ||
    Number.isNaN(ends.valueOf()) ||
    ends <= starts
  )
    throw new Error("Choose a valid start and end period.");
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("blocked_periods")
    .update({
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      reason: v.reason,
      internal_notes: v.internal_notes || null,
    })
    .eq("id", v.id)
    .eq("studio_id", v.studio_id);
  if (error) throw new Error(error.message);
  refresh();
}
export async function saveProductionType(form: FormData) {
  const v = z
    .object({
      id: z.union([z.literal(""), id]),
      name: text(120).min(1),
      slug: text(140),
      description: text(1000),
      sort_order: z.coerce.number().int(),
      active: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase } = await permitted();
  const base = (v.slug || v.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) throw new Error("Enter a valid production type name.");
  let slug = base,
    suffix = 2;
  while (true) {
    let query = supabase
      .from("booking_purposes")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (v.id) query = query.neq("id", v.id);
    const { data } = await query;
    if (!data?.length) break;
    slug = `${base}-${suffix++}`;
  }
  const values = {
    name: v.name,
    slug,
    description: v.description || null,
    sort_order: v.sort_order,
    active: v.active === "on",
  };
  const { error } = v.id
    ? await supabase.from("booking_purposes").update(values).eq("id", v.id)
    : await supabase.from("booking_purposes").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}
export async function deleteProductionType(form: FormData) {
  const target = id.parse(form.get("id"));
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("booking_purposes")
    .delete()
    .eq("id", target);
  if (error) throw new Error(error.message);
  refresh();
}
export async function addStudioImages(form: FormData) {
  const studioId = id.parse(form.get("studio_id"));
  const { supabase, user } = await permitted();
  const files = form
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length) throw new Error("Choose at least one studio image.");
  if (files.length > 12)
    throw new Error("Upload no more than 12 images at once.");
  const rows = [];
  for (const file of files) {
    const image_url = await uploadImage(supabase, user.id, file, "");
    if (image_url)
      rows.push({ studio_id: studioId, image_url, alt_text: "Studio photo" });
  }
  const { error } = await supabase.from("studio_images").insert(rows);
  if (error) throw new Error(error.message);
  refresh();
}

async function uploadStudioImages(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  userId: string,
  studioId: string,
  entries: FormDataEntryValue[],
  returnCover = false,
) {
  const files = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length) return null;
  if (files.length > 12) throw new Error("Upload no more than 12 images at once.");
  const rows: { studio_id: string; image_url: string; alt_text: string }[] = [];
  for (const file of files) {
    const image_url = await uploadImage(supabase, userId, file, "");
    if (image_url) rows.push({ studio_id: studioId, image_url, alt_text: "Studio photo" });
  }
  if (rows.length) {
    const { error } = await supabase.from("studio_images").insert(rows);
    if (error) throw new Error(error.message);
  }
  return returnCover ? rows[0]?.image_url || null : null;
}
export async function deleteStudioImage(form: FormData) {
  const imageId = id.parse(form.get("id"));
  const { supabase } = await permitted();
  const { error } = await supabase
    .from("studio_images")
    .delete()
    .eq("id", imageId);
  if (error) throw new Error(error.message);
  refresh();
}

async function uniqueStudioSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  value: string,
  currentId?: string,
) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) throw new Error("Enter a valid studio name.");
  let slug = base;
  let suffix = 2;
  while (true) {
    let query = supabase.from("studios").select("id").eq("slug", slug).limit(1);
    if (currentId) query = query.neq("id", currentId);
    const { data } = await query;
    if (!data?.length) return slug;
    slug = `${base}-${suffix++}`;
  }
}
