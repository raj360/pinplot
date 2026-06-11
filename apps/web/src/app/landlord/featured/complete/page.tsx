import { Suspense } from "react";
import { FeaturedCompleteClient } from "@/app/landlord/featured/complete/FeaturedCompleteClient";
import { LoadingState } from "@/components/ui/loading-state";

export default function FeaturedCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState label="Confirming payment" />
        </div>
      }
    >
      <FeaturedCompleteClient />
    </Suspense>
  );
}
