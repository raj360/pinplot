import { apiFetch } from "./client";
import { LISTING_REPORT_REASONS } from "@plotpin/shared-types";

export type ListingReportReason = (typeof LISTING_REPORT_REASONS)[number];

export async function reportListing(
  buildingId: string,
  payload: { reason: ListingReportReason; details?: string },
) {
  return apiFetch<{
    id: string;
    buildingId: string;
    reason: string;
    status: string;
    createdAt: string;
  }>(`/buildings/${buildingId}/report`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type OpenListingReport = {
  id: string;
  buildingId: string;
  buildingName: string;
  city: string;
  district: string | null;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
};

export async function fetchOpenReports() {
  return apiFetch<OpenListingReport[]>("/admin/reports");
}

export async function reviewReport(
  reportId: string,
  payload: { status: "REVIEWED" | "DISMISSED"; adminNotes?: string },
) {
  return apiFetch(`/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
