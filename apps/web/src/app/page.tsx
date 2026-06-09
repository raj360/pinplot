import { headers } from "next/headers";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeTrustStrip } from "@/components/home/HomeTrustStrip";
import { HomeValueProps } from "@/components/home/HomeValueProps";
import { HomeLandlordCta } from "@/components/home/HomeLandlordCta";
import { HomeFooter } from "@/components/home/HomeFooter";
import { fetchFeaturedBuildings } from "@/lib/api/buildings";
import { resolveServerViewerCountry } from "@/lib/intl/resolve-viewer-country";

export default async function HomePage() {
  const headerStore = await headers();
  const serverCountryCode = resolveServerViewerCountry(headerStore);
  const [localFeatured, globalFeatured] = await Promise.all([
    fetchFeaturedBuildings({
      limit: 6,
      countryCode: serverCountryCode,
      localOnly: true,
    }).catch(() => []),
    fetchFeaturedBuildings({
      limit: 12,
      excludeCountryCode: serverCountryCode,
    }).catch(() => []),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <PageMain className="flex flex-1 flex-col gap-12 bg-linear-to-b from-primary/[0.04] via-background to-background sm:gap-14">
        <HeroSection />
        <HomeTrustStrip />
        <HomeHowItWorks />
        <FeaturedListingsSection
          initialFeed={{ local: localFeatured, global: globalFeatured }}
          serverCountryCode={serverCountryCode}
        />
        <HomeValueProps />
        <HomeLandlordCta />
      </PageMain>

      <HomeFooter />
    </div>
  );
}
