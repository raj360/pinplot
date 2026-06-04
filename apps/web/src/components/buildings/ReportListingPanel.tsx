"use client";

import { useState } from "react";
import Link from "next/link";
import { LISTING_REPORT_REASONS } from "@plotpin/shared-types";
import { reportListing } from "@/lib/api/reports";
import { Button } from "@/components/ui/button";

export function ReportListingPanel({
  buildingId,
  buildingName,
}: {
  buildingId: string;
  buildingName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(LISTING_REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await reportListing(buildingId, {
        reason: reason as (typeof LISTING_REPORT_REASONS)[number],
        details: details.trim() || undefined,
      });
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-green-800">
        Thank you — we received your report for {buildingName}. Our team will
        review it.
      </p>
    );
  }

  return (
    <div className="border border-border bg-surface p-4 text-sm">
      <p className="font-medium text-foreground">Report this listing</p>
      <p className="mt-1 text-muted">
        Suspected scam, wrong location, or misleading photos? Report after unlock
        so we can investigate. PlotPin does not collect broker &quot;blockage&quot;
        fees —{" "}
        <Link href="/terms" className="text-primary hover:underline">
          see Terms
        </Link>
        .
      </p>
      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={() => setOpen(true)}
        >
          Report a problem
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
            >
              {LISTING_REPORT_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Details {reason === "Other" ? "(required)" : "(optional)"}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              placeholder="What happened when you contacted the landlord?"
            />
          </label>
          {error ? <p className="text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              loading={submitting}
              loadingLabel="Submitting report"
              onClick={() => void submit()}
            >
              Submit report
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
