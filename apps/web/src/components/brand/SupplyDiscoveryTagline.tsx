"use client";

import { supplyDiscoveryTagline } from "@/lib/copy/supply-discovery";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type SupplyDiscoveryTaglineProps = {
  className?: string;
};

export function SupplyDiscoveryTagline({ className }: SupplyDiscoveryTaglineProps) {
  const { ready, viewer, countriesByCode } = useViewerContext();

  if (!ready) {
    return (
      <p className={className}>
        Map-first rentals · Verified supply, global discovery
      </p>
    );
  }

  const countryName =
    countriesByCode.get(viewer.countryCode)?.name ?? viewer.countryCode;

  return (
    <p className={className}>{supplyDiscoveryTagline(viewer.countryCode, countryName)}</p>
  );
}
