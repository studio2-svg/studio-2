import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import { uploadMedia } from "../content-actions";
import { ActionForm } from "@/components/action-form";
import {
  CollectionHeader,
  SaveButton,
  TextField,
} from "@/components/admin-form-fields";
export default async function MediaAdmin() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("media_type", "image")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    <>
      <CollectionHeader
        eyebrow="Website"
        title="Image library"
        description="Upload JPG, PNG, WebP, or GIF images up to 10 MB—no URLs required."
      />
      <ActionForm action={uploadMedia} successMessage="Image uploaded." className="mt-8 grid gap-4 bg-paper p-6">
        <label className="text-sm">
          <span className="mb-2 block">Choose image</span>
          <input
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp,image/gif"
          />
        </label>
        <TextField name="alt_text" label="Alternative text" />
        <SaveButton label="Upload image" />
      </ActionForm>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((asset) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from("media").getPublicUrl(asset.storage_path);
          return (
            <article key={asset.id} className="bg-paper p-4">
              <div className="relative aspect-video overflow-hidden bg-black/5">
                <Image
                  src={publicUrl}
                  alt={asset.alt_text || asset.file_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-3 truncate font-medium">{asset.file_name}</p>
              <p className="mt-1 text-xs text-black/45">
                {(asset.file_size / 1024).toFixed(1)} KB
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}
