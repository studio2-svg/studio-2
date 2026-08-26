"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export type CmsActionState = { error?: string; success?: string };
const pageSchema = z.object({ id: z.uuid(), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().trim().min(1).max(160), subtitle: z.string().trim().max(200), description: z.string().trim().max(1000), body: z.string().max(20000), seoTitle: z.string().trim().max(70), seoDescription: z.string().trim().max(170), canonicalUrl: z.union([z.literal(""), z.url()]), ogTitle: z.string().trim().max(100), ogDescription: z.string().trim().max(250), ogImageUrl: z.union([z.literal(""), z.url()]), robots: z.enum(["index,follow", "noindex,follow", "noindex,nofollow"]), intent: z.enum(["draft", "publish", "archive"]) });
export async function savePage(_: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const parsed = pageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Invalid content." };
  const { supabase, user } = await requireAdmin(); const input = parsed.data;
  const status = input.intent === "publish" ? "published" : input.intent === "archive" ? "archived" : "draft";
  const { data: current, error: readError } = await supabase.from("cms_pages").select("content").eq("id", input.id).single();
  if (readError) return { error: readError.message };
  const content = { ...((current?.content as Record<string, unknown>) || {}), body: input.body };
  const { error } = await supabase.from("cms_pages").update({ title: input.title, subtitle: input.subtitle || null, description: input.description || null, content, status, seo_title: input.seoTitle || null, seo_description: input.seoDescription || null, canonical_url: input.canonicalUrl || null, og_title: input.ogTitle || null, og_description: input.ogDescription || null, og_image_url: input.ogImageUrl || null, robots: input.robots, published_at: status === "published" ? new Date().toISOString() : null, updated_by: user.id }).eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/"); revalidatePath(`/${input.slug}`); revalidatePath(`/admin/website/pages/${input.slug}`);
  return { success: status === "published" ? "Published successfully." : status === "draft" ? "Draft saved." : "Page archived." };
}
export async function restorePageVersion(formData: FormData) { const id = z.uuid().parse(formData.get("id")); const version = z.coerce.number().int().positive().parse(formData.get("version")); const slug = z.string().parse(formData.get("slug")); const { supabase } = await requireAdmin(); const { error } = await supabase.rpc("restore_cms_page_version", { target_page: id, target_version: version }); if (error) throw new Error(error.message); revalidatePath(`/${slug}`); revalidatePath(`/admin/website/pages/${slug}`); }
