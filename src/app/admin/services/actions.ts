"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/upload-image";
const optionalId = z.union([z.literal(""), z.uuid()]),
  text = (n = 500) => z.string().trim().max(n);
function refresh() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}
export async function saveService(form: FormData) {
  const v = z
    .object({
      id: optionalId,
      name: text(140).min(1),
      slug: text(160),
      description: text(2000),
      current_image_url: z.string(),
      price: z.coerce.number().min(0),
      pricing_type: z.enum([
        "hourly",
        "daily",
        "fixed",
        "percentage",
        "custom",
      ]),
      duration_minutes: z.union([
        z.literal(""),
        z.coerce.number().int().positive(),
      ]),
      sort_order: z.coerce.number().int(),
      active: z.string().optional(),
      featured: z.string().optional(),
    })
    .parse(Object.fromEntries(form));
  const { supabase, user } = await requireAdmin();
  const baseSlug = (v.slug || v.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!baseSlug) throw new Error("Enter a valid service name.");
  let slug = baseSlug;
  let suffix = 2;
  while (true) {
    let query = supabase.from("services").select("id").eq("slug", slug).limit(1);
    if (v.id) query = query.neq("id", v.id);
    const { data } = await query;
    if (!data?.length) break;
    slug = `${baseSlug}-${suffix++}`;
  }
  const image_url = await uploadImage(
    supabase,
    user.id,
    form.get("image"),
    v.current_image_url,
  );
  const values = {
    name: v.name,
    slug,
    description: v.description || null,
    image_url,
    price_minor: Math.round(v.price * 100),
    pricing_type: v.pricing_type,
    duration_minutes: v.duration_minutes || null,
    sort_order: v.sort_order,
    active: v.active === "on",
    featured: v.featured === "on",
  };
  const { error } = v.id
    ? await supabase.from("services").update(values).eq("id", v.id)
    : await supabase.from("services").insert(values);
  if (error) throw new Error(error.message);
  refresh();
}
export async function deleteService(form: FormData) {
  const target = z.uuid().parse(form.get("id"));
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("services").delete().eq("id", target);
  if (error) throw new Error(error.message);
  refresh();
}
