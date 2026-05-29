import { Suspense } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { CompleteProfileClient } from "./CompleteProfileClient";

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading profile" />}>
      <CompleteProfileClient />
    </Suspense>
  );
}
