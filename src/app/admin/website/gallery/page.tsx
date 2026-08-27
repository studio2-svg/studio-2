import { requireAdmin } from "@/lib/auth";
import { CollectionHeader } from "@/components/admin-form-fields";
import { GalleryManager } from "@/components/gallery-manager";

export default async function GalleryAdmin() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("gallery_items").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return <><CollectionHeader eyebrow="Website" title="Gallery" description="Upload and curate photography for the public gallery." /><GalleryManager items={data || []} /></>;
}
