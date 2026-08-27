"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/upload-image";
const text = (n = 500) => z.string().trim().max(n),
  optionalId = z.union([z.literal(""), z.uuid()]);
function refresh() {
  revalidatePath("/admin/staff");
  revalidatePath("/team");
  revalidatePath("/");
}
export async function saveStaffCategory(form: FormData) {
  const v = z
    .object({
      id: optionalId,
      name: text(100).min(1),
      slug: text(120),
      description: text(1000),
      sort_order: z.coerce.number().int(),
      active: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase } = await requireAdmin();
  const base = slugify(v.slug || v.name);
  let slug = base;
  let suffix = 2;
  while (true) {
    let query = supabase
      .from("staff_categories")
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
    ? await supabase.from("staff_categories").update(values).eq("id", v.id)
    : await supabase.from("staff_categories").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}
export async function saveStaffMember(form: FormData) {
  const v = z
    .object({
      id: optionalId,
      category_id: z.union([z.literal(""), z.uuid()]),
      name: text(160).min(1),
      slug: text(180),
      current_profile_photo_url: z.string(),
      bio: text(3000),
      role_title: text(160),
      email: z.union([z.literal(""), z.email()]),
      phone: text(80),
      base_price: z.coerce.number().min(0),
      pricing_type: z.enum(["hourly", "daily", "fixed", "per_booking"]),
      status: z.enum(["active", "unavailable", "leave", "archived"]),
      featured: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await requireAdmin();
  const base = slugify(v.slug || v.name);
  let slug = base;
  let suffix = 2;
  while (true) {
    let query = supabase
      .from("staff_members")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (v.id) query = query.neq("id", v.id);
    const { data } = await query;
    if (!data?.length) break;
    slug = `${base}-${suffix++}`;
  }
  const profile_photo_url = await uploadImage(
    supabase,
    user.id,
    form.get("profile_photo"),
    v.current_profile_photo_url,
  );
  const values = {
      category_id: v.category_id || null,
      name: v.name,
      slug,
      profile_photo_url,
      bio: v.bio || null,
      role_title: v.role_title || null,
      email: v.email || null,
      phone: v.phone || null,
      base_price_minor: Math.round(v.base_price * 100),
      pricing_type: v.pricing_type,
      status: v.status,
      featured: v.featured === "on",
    };
  const { error } = v.id
    ? await supabase.from("staff_members").update(values).eq("id", v.id)
    : await supabase.from("staff_members").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteStaffMember(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("staff_members").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
export async function addPurpose(form: FormData) {
  const v = z
    .object({
      name: text(120).min(1),
      slug: text(140),
      description: text(1000),
      sort_order: z.coerce.number().int(),
    })
    .parse(Object.fromEntries(form));
  const { supabase } = await requireAdmin();
  const base = slugify(v.slug || v.name);
  let slug = base;
  let suffix = 2;
  while (true) {
    const { data } = await supabase
      .from("booking_purposes")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (!data?.length) break;
    slug = `${base}-${suffix++}`;
  }
  const { error } = await supabase
    .from("booking_purposes")
    .insert({ ...v, slug, active: true });
  if (error) throw new Error(error.message);
  refresh();
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new Error("Enter a name that contains letters or numbers.");
  return slug;
}
export async function saveRecommendation(form: FormData) {
  const v = z
    .object({
      purpose_id: z.uuid(),
      staff_category_id: z.uuid(),
      recommended_quantity: z.coerce.number().int().min(0),
      minimum_quantity: z.coerce.number().int().min(0),
      maximum_quantity: z.coerce.number().int().min(0),
      required: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  if (
    v.maximum_quantity < v.minimum_quantity ||
    v.recommended_quantity > v.maximum_quantity
  )
    throw new Error("Recommendation quantities are inconsistent.");
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("production_requirement_rules")
    .upsert(
      { ...v, required: v.required === "on" },
      { onConflict: "purpose_id,staff_category_id" },
    );
  if (error) throw new Error(error.message);
  refresh();
}
