import { createClient } from "@/lib/supabase/client";

export async function uploadBuildingImage(
  buildingId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${buildingId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("building-images")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("building-images").getPublicUrl(path);
  return data.publicUrl;
}
