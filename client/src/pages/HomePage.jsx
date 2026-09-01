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
import { FeaturedCollections } from '@/components/sections/FeaturedCollections';
import { Testimonials } from '@/components/sections/Testimonials';
import { useSeo } from '@/hooks/useSeo';
import { usePublicSettings } from '@/features/settings/settingsApi';
import {
  APP_NAME,
  APP_ALTERNATE_NAME,
  APP_SHORT_NAME,
  SITE_URL,
  SUPPORT_PHONE,
  SUPPORT_EMAIL,
  STORE_LOCALITY,
  STORE_DISTRICT,
  STORE_STATE,
} from '@/config/appConfig';

// The homepage is the one URL every local/brand-name search ("Amardeep
// Jewellers Akbarpur", "ASDP jewellers", "sarafa Ambedkar Nagar" ...) should
// actually land on, and the only page carrying the site's JewelryStore/
// LocalBusiness JSON-LD (see useSeo.js - one script slot, only meaningful
// once per page). NAP fields prefer real Settings data (Admin -> Settings)
// over the appConfig fallbacks so this stays accurate the moment an admin
// fills those in, with no code change needed.
export default function HomePage() {
  const { data: settings } = usePublicSettings();

  useSeo({
    title: `${APP_NAME} (${APP_ALTERNATE_NAME}) | Gold & Diamond Jewellery in ${STORE_LOCALITY}, ${STORE_DISTRICT}`,
    description: `${APP_NAME} - known locally as ${APP_ALTERNATE_NAME} - certified BIS hallmark gold, diamond & silver jewellery in ${STORE_LOCALITY}, ${STORE_DISTRICT} (${STORE_STATE}). Today's gold rate, free shipping across India, easy returns.`,
    canonical: SITE_URL,
    image: `${SITE_URL}/logo.jpg`,
    jsonLd: {
      '@type': 'JewelryStore',
      name: APP_NAME,
      alternateName: [APP_ALTERNATE_NAME, APP_SHORT_NAME],
      url: SITE_URL,
      logo: `${SITE_URL}/logo.jpg`,
      image: `${SITE_URL}/logo.jpg`,
      telephone: settings?.contactPhone || SUPPORT_PHONE,
      email: settings?.contactEmail || SUPPORT_EMAIL,
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings?.address || undefined,
        addressLocality: STORE_LOCALITY,
        addressRegion: STORE_STATE,
        addressCountry: 'IN',
      },
      ...(Object.values(settings?.socialLinks || {}).some(Boolean)
        ? { sameAs: Object.values(settings.socialLinks).filter(Boolean) }
        : {}),
    },
  });

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
      <FeaturedCollections />
      {/* <TrustBadges /> */}
      <AllProductsShowcase />
      <NewArrivals />
      <TrendingNow />
      <PromoBanners />
      <Testimonials />
    </div>
  );
}
