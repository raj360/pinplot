import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";
import { LoadingState } from "@/components/ui/loading-state";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState label="Loading explore" />
        </div>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
