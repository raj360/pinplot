import { syncProfile } from "@/lib/api/buildings";

/** Best-effort profile sync after Supabase session is established. */
export async function syncProfileAfterAuth(accessToken: string): Promise<void> {
  try {
    await syncProfile(accessToken);
  } catch {
    /* profile row is created by DB trigger; API sync is optional */
  }
}
