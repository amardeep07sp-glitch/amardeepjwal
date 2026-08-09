import { HeroBanner } from '@/components/sections/Hero';
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
    <div className="flex min-w-0 flex-col gap-10 pb-16 sm:gap-14">
      {/* <OfferRibbon /> */}
      <HeroBanner />
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
