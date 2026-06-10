import TenantUnlocksClient from "./TenantUnlocksClient";
import { Suspense } from "react";
import { TenantUnlocksSkeleton } from "@/components/landlord/LandlordPageSkeletons";

export default function TenantUnlocksPage() {
  return (
    <Suspense fallback={<TenantUnlocksSkeleton />}>
      <TenantUnlocksClient />
    </Suspense>
  );
}
