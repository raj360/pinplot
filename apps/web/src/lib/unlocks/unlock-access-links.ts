import type { TenantUnlock } from "@/lib/api/unlocks";
import {
  googleMapsDirectionsUrl,
} from "@/lib/maps/directions";
import {
  isPhoneContact,
  supportsWhatsApp,
  telHref,
  whatsAppHref,
} from "@plotpin/shared-types";

export function unlockHubUrl(unlockId: string) {
  if (typeof window === "undefined") {
    return `/tenant/unlocks?unlock=${encodeURIComponent(unlockId)}`;
  }
  const base = window.location.origin.replace(/\/$/, "");
  return `${base}/tenant/unlocks?unlock=${encodeURIComponent(unlockId)}`;
}

export function unlockCalendarUrl(unlock: TenantUnlock) {
  if (!unlock.expiresAt) return null;
  const end = new Date(unlock.expiresAt);
  const start = new Date(end.getTime() - 30 * 60 * 1000);
  const title = encodeURIComponent(
    `PlotPin unlock ends: ${unlock.buildingName ?? "Listing"} Unit ${unlock.unitNumber}`,
  );
  const details = encodeURIComponent(
    `Your paid contact access ends soon. Open My unlocks: ${unlockHubUrl(unlock.unlockId)}`,
  );
  const format = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(start)}/${format(end)}&details=${details}`;
}

export function primaryUnlockPhone(unlock: TenantUnlock) {
  const phone = unlock.contact.phone;
  return phone && isPhoneContact(phone) ? phone : null;
}

export function unlockWhatsAppHref(unlock: TenantUnlock) {
  const phone = primaryUnlockPhone(unlock);
  if (!phone || !supportsWhatsApp(phone)) return null;
  return whatsAppHref(
    phone,
    `Hi, I unlocked Unit ${unlock.unitNumber} on PlotPin and would like to arrange a viewing.`,
  );
}

export function unlockTelHref(unlock: TenantUnlock) {
  const phone = primaryUnlockPhone(unlock);
  return phone ? telHref(phone) : null;
}

export function unlockDirectionsHref(unlock: TenantUnlock) {
  const { lat, lng } = unlock.location;
  return googleMapsDirectionsUrl(lat, lng);
}
