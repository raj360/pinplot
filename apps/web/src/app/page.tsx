import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HomeValueProps } from "@/components/home/HomeValueProps";
import { HomeLandlordCta } from "@/components/home/HomeLandlordCta";
import { HomeFooter } from "@/components/home/HomeFooter";
import { fetchFeaturedBuildings } from "@/lib/api/buildings";

export default async function HomePage() {
  let featured = await fetchFeaturedBuildings(12).catch(() => []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      <PageMain className="flex flex-1 flex-col gap-12 sm:gap-14">
        <HeroSection />
        <FeaturedListingsSection buildings={featured} />
        <HomeValueProps />
        <HomeLandlordCta />
      </PageMain>

      <HomeFooter />
    </div>
  );
}
