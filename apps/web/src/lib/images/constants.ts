import { BUILDING_IMAGE } from "@plotpin/shared-types";

/** Human-readable upload hint for landlord/admin photo pickers. */
export const BUILDING_PHOTO_UPLOAD_HINT =
  `JPEG or PNG from your phone is fine — we optimize to ~${Math.round(BUILDING_IMAGE.FULL_MAX_PX / 100) / 10}K px before upload.`;
