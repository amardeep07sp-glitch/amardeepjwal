import { HeroBanner } from '@/components/sections/Hero';
import { MetalRateStrip } from '@/components/sections/MetalRateStrip';
import { LocationPrompt } from '@/components/sections/LocationPrompt';
// import { OfferRibbon } from '@/components/sections/OfferRibbon';
// import { TrustBadges } from '@/components/sections/TrustBadges';
import { ShopByCategory } from '@/components/sections/ShopByCategory';
import { AllProductsShowcase } from '@/components/sections/AllProductsShowcase';
import { NewArrivals } from '@/components/sections/NewArrivals';
import { TrendingNow } from '@/components/sections/TrendingNow';
import { PromoBanners } from '@/components/sections/PromoBanners';
import { Testimonials } from '@/components/sections/Testimonials';

export default function HomePage() {
  return (
    <div className="flex min-w-0 flex-col gap-8 pb-16 sm:gap-10">
      {/* <OfferRibbon /> */}
      {/* Grouped so the big inter-section gap-8/gap-10 rhythm below doesn't
          apply between the strip and the hero it sits on top of - they read
          as one connected unit, not two separate sections. */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <MetalRateStrip />
        <HeroBanner />
      </div>
      <LocationPrompt />
      <ShopByCategory />
      {/* <TrustBadges /> */}
      <AllProductsShowcase />
      <NewArrivals />
      <TrendingNow />
      <PromoBanners />
      <Testimonials />
    </div>
  );
}
