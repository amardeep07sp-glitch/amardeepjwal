import { SmartLink } from '@/components/global/SmartLink';
import { useBanners } from '@/features/banners/bannersApi';
import { track } from '@/lib/analytics';

// Admin -> CMS -> Banners, position "Homepage secondary" - the 2-tile promo
// strip (e.g. "Wedding Collection" / "Gifting") a jewellery homepage
// usually has below New Arrivals. Renders nothing at all until at least
// one such banner exists - no fabricated placeholder tiles.
export function PromoBanners() {
  const { data: banners } = useBanners('homepage_secondary');

  if (!banners?.length) return null;

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className={`grid grid-cols-1 gap-4 ${banners.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {banners.map((banner) => {
          const content = (
            <div className="relative flex min-h-56 flex-col justify-end overflow-hidden rounded-3xl shadow-[0_20px_45px_-18px_rgba(17,24,39,0.4)] ring-1 ring-primary/10 transition-shadow duration-300 group-hover:shadow-[0_25px_55px_-18px_rgba(200,162,74,0.45)] sm:min-h-64">
              {banner.primaryMedia && (
                <img
                  src={banner.primaryMedia.secureUrl}
                  alt={banner.altText || banner.title}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
              <div className="relative flex flex-col gap-2 p-6">
                {banner.subtitle && (
                  <span className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{banner.subtitle}</span>
                )}
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">{banner.title}</h3>
                {banner.description && <p className="max-w-xs text-sm text-white/80">{banner.description}</p>}
                {banner.linkUrl && (
                  <span className="mt-1 inline-flex w-fit items-center rounded-button border border-white/70 px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase transition-colors group-hover:border-white group-hover:bg-white group-hover:text-heading">
                    {banner.ctaLabel || 'Explore Now'}
                  </span>
                )}
              </div>
            </div>
          );

          return banner.linkUrl ? (
            <SmartLink
              key={banner.id}
              to={banner.linkUrl}
              className="group"
              onClick={() => track('banner_click', { metadata: { bannerId: banner.id, destination: banner.linkUrl } })}
            >
              {content}
            </SmartLink>
          ) : (
            <div key={banner.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
