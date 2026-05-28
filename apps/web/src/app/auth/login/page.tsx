import { Suspense } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
