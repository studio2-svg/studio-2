"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/upload-image";
const text = (n = 500) => z.string().trim().max(n);
const optionalId = z.union([z.literal(""), z.uuid()]);
function refresh() {
  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
}
export async function saveCategory(form: FormData) {
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
  const baseSlug=(v.slug||v.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  if(!baseSlug)throw new Error("Enter a valid category name.");
  let slug=baseSlug,suffix=2;
  while(true){let query=supabase.from("equipment_categories").select("id").eq("slug",slug).limit(1);if(v.id)query=query.neq("id",v.id);const{data}=await query;if(!data?.length)break;slug=`${baseSlug}-${suffix++}`}
  const values = {
    name: v.name,
    slug,
    description: v.description || null,
    sort_order: v.sort_order,
    active: v.active === "on",
  };
  const { error } = v.id
    ? await supabase.from("equipment_categories").update(values).eq("id", v.id)
    : await supabase.from("equipment_categories").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}
export async function saveEquipment(form: FormData) {
  const v = z
    .object({
      id: optionalId,
      category_id: z.union([z.literal(""), z.uuid()]),
      name: text(160).min(1),
      slug: text(160),
      description: text(3000),
      specifications: text(5000),
      current_image_url: z.string(),
      total_quantity: z.coerce.number().int().min(0),
      price: z.coerce.number().min(0),
      pricing_type: z.enum(["hourly", "daily", "fixed", "included"]),
      status: z.enum(["available", "unavailable", "maintenance", "retired"]),
      featured: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await requireAdmin();
  const baseSlug=(v.slug||v.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  if(!baseSlug)throw new Error("Enter a valid equipment name.");
  let slug=baseSlug,suffix=2;
  while(true){let query=supabase.from("equipment").select("id").eq("slug",slug).limit(1);if(v.id)query=query.neq("id",v.id);const{data}=await query;if(!data?.length)break;slug=`${baseSlug}-${suffix++}`}
  const image_url=await uploadImage(supabase,user.id,form.get("image"),v.current_image_url);
  const values = {
    category_id: v.category_id || null,
    name: v.name,
    slug,
    description: v.description || null,
    specifications: v.specifications || null,
    image_url,
    total_quantity: v.total_quantity,
    price_minor: Math.round(v.price * 100),
    pricing_type: v.pricing_type,
    status: v.status,
    featured: v.featured === "on",
  };
  const { error } = v.id
    ? await supabase.from("equipment").update(values).eq("id", v.id)
    : await supabase.from("equipment").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}
export async function addMaintenance(form: FormData) {
  const v = z
    .object({
      equipment_id: z.uuid(),
      starts_at: z.string().min(1),
      ends_at: z.string(),
      reason: text(300).min(1),
      notes: text(1000),
    })
    .parse(Object.fromEntries(form));
  const { user, supabase } = await requireAdmin();
  const starts = new Date(v.starts_at),
    ends = v.ends_at ? new Date(v.ends_at) : null;
  if (Number.isNaN(starts.valueOf()) || (ends && ends <= starts))
    throw new Error("Invalid maintenance period.");
  const { error } = await supabase
    .from("equipment_maintenance")
    .insert({
      equipment_id: v.equipment_id,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() || null,
      reason: v.reason,
      notes: v.notes || null,
      created_by: user.id,
    });
  if (error) throw new Error(error.message);
  await supabase
    .from("equipment")
    .update({ status: "maintenance" })
    .eq("id", v.equipment_id);
  refresh();
}
export async function deleteEquipment(form:FormData){const target=z.uuid().parse(form.get("id"));const{supabase}=await requireAdmin();const{error}=await supabase.from("equipment").delete().eq("id",target);if(error)throw new Error(error.message);refresh()}
