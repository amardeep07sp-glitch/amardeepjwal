import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { SmartLink } from '@/components/global/SmartLink';
import { useBanners } from '@/features/banners/bannersApi';
import { track } from '@/lib/analytics';

const SHOWN_KEY = 'adsp_popup_ad_shown';

// Once per browser tab session, and re-shown if the admin publishes a
// different popup banner (keyed to the banner's own id, not just "shown:
// true") - a brand-new campaign shouldn't stay hidden just because an
// older one was already dismissed this session.
function wasShown(bannerId) {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === bannerId;
  } catch {
    return false;
  }
}

function markShown(bannerId) {
  try {
    sessionStorage.setItem(SHOWN_KEY, bannerId);
  } catch {
    // sessionStorage unavailable (private mode etc.) - it'll just show
    // again next navigation, never a functional break.
  }
}

// Admin -> CMS -> Banners, position "Popup ad" - a fully admin-authored
// modal ad shown once per session on first landing anywhere on the site.
// Reuses the existing Banner entity (image, linkUrl, schedule window)
// instead of a bespoke model - see backend cms.js#BANNER_POSITIONS.
export function PopupAdModal() {
  const { data: banners } = useBanners('popup_ad');
  const [open, setOpen] = useState(false);
  const banner = banners?.[0];

  useEffect(() => {
    if (!banner || wasShown(banner.id)) return;
    setOpen(true);
    markShown(banner.id);
  }, [banner]);

  if (!banner?.primaryMedia) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
        {/* Visually hidden - DialogContent requires an accessible title
            even when the visible design is just an image (Radix warns
            otherwise), same "real title, no throwaway text" discipline as
            every other CMS-driven surface in this app. */}
        <DialogTitle className="sr-only">{banner.title}</DialogTitle>

        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <X className="size-4" />
        </button>

        <SmartLink
          to={banner.linkUrl || '#'}
          onClick={() => {
            track('banner_click', { metadata: { bannerId: banner.id, destination: banner.linkUrl } });
            setOpen(false);
          }}
          className="block"
        >
          <img src={banner.primaryMedia.secureUrl} alt={banner.altText || banner.title} className="w-full object-cover" />
          {(banner.title || banner.description) && (
            <div className="flex flex-col gap-1 p-5 text-center">
              {banner.title && <h3 className="font-display text-xl font-bold text-heading">{banner.title}</h3>}
              {banner.description && <p className="text-sm text-muted-foreground">{banner.description}</p>}
              {banner.linkUrl && (
                <span className="mx-auto mt-2 inline-flex w-fit items-center rounded-button bg-primary px-5 py-2 text-xs font-semibold tracking-wide text-primary-foreground uppercase">
                  {banner.ctaLabel || 'Explore Now'}
                </span>
              )}
            </div>
          )}
        </SmartLink>
      </DialogContent>
    </Dialog>
  );
}
