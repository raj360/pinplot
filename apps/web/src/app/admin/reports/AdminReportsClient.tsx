"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/button";
import {
  fetchOpenReports,
  reviewReport,
  type OpenListingReport,
} from "@/lib/api/reports";
import { getAccessToken } from "@/lib/api/client";

export default function AdminReportsClient() {
  const router = useRouter();
  const [reports, setReports] = useState<OpenListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      setReports(await fetchOpenReports());
      setError(null);
    } catch {
      setError("Could not load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin/reports");
        return;
      }
      await load();
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function resolve(
    id: string,
    status: "REVIEWED" | "DISMISSED",
  ) {
    setBusyId(id);
    try {
      await reviewReport(id, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardSection
      title="Listing reports"
      description="Tenant reports (post-unlock). Review and mark resolved or dismissed."
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted">No open reports.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report.id}
              className="border border-border bg-surface p-4"
            >
              <p className="font-medium">
                <Link
                  href={`/buildings/${report.buildingId}`}
                  className="text-primary hover:underline"
                >
                  {report.buildingName}
                </Link>
                {" · "}
                {[report.district, report.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-sm text-foreground">{report.reason}</p>
              {report.details ? (
                <p className="mt-2 text-sm text-muted">{report.details}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                Reporter:{" "}
                {[report.reporter.firstName, report.reporter.lastName]
                  .filter(Boolean)
                  .join(" ") || report.reporter.email || "—"}
                {" · "}
                {new Date(report.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  loading={busyId === report.id}
                  loadingLabel="Updating report"
                  onClick={() => void resolve(report.id, "REVIEWED")}
                >
                  Mark reviewed
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === report.id}
                  onClick={() => void resolve(report.id, "DISMISSED")}
                >
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
