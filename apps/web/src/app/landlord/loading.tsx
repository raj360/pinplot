import { AppLoadingOverlay } from "@/components/ui/app-loading-overlay";

/** Shown during landlord route transitions — in-page data uses section skeletons. */
export default function LandlordLoading() {
  return <AppLoadingOverlay show label="Loading" />;
}
