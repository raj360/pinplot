import { Suspense } from "react";
import { UnlockCompleteClient } from "@/app/tenant/unlocks/complete/UnlockCompleteClient";
import { LoadingState } from "@/components/ui/loading-state";

export default function UnlockCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState label="Confirming payment" />
        </div>
      }
    >
      <UnlockCompleteClient />
    </Suspense>
  );
}
