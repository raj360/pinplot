import { Suspense } from "react";
import  LandlordDashboardClient  from "./LandlordDashboardClient";

export default function LandlordDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading…</p>}>
      <LandlordDashboardClient />
    </Suspense>
  );
}
