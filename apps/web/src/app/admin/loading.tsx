import { AppLoadingOverlay } from "@/components/ui/app-loading-overlay";

/** Route transitions within /admin — matches landlord shell behavior. */
export default function AdminLoading() {
  return <AppLoadingOverlay show label="Loading" />;
}
