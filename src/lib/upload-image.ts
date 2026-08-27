type StorageClient = { storage: { from(bucket: string): { upload(path: string, file: File, options: { contentType: string; upsert: boolean }): Promise<{ error: { message: string } | null }>; getPublicUrl(path: string): { data: { publicUrl: string } } } } };
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export async function uploadImage(supabase: StorageClient, userId: string, file: FormDataEntryValue | null, currentUrl = "") {
  if (!(file instanceof File) || file.size === 0) return currentUrl || null;
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose an image up to 8 MB.");
  if (!allowed.has(file.type)) throw new Error("Upload a JPG, PNG, WebP, or GIF image.");
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const path = `${userId}/images/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
