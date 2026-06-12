const DISMISS_KEY = "plotpin:landlord-hold-dismissed-v1";

export type LandlordHoldAlert = {
  unitId: string;
  unitNumber: string;
  buildingId: string;
  buildingName: string;
  endedAt: string;
};

export function readDismissedHoldAlertKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

export function dismissHoldAlert(alertKey: string) {
  const next = readDismissedHoldAlertKeys();
  next.add(alertKey);
  window.localStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
}

export function holdAlertKey(alert: LandlordHoldAlert) {
  return `${alert.buildingId}:${alert.unitId}:${alert.endedAt}`;
}

export function filterVisibleHoldAlerts(alerts: LandlordHoldAlert[]) {
  const dismissed = readDismissedHoldAlertKeys();
  return alerts.filter((alert) => !dismissed.has(holdAlertKey(alert)));
}
