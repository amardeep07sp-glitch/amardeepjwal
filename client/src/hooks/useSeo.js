import { useEffect } from 'react';

// Dependency-free, client-side-only "SEO" - sets document.title and upserts
// a description meta tag + canonical link. This is a CSR app with no
// server-side rendering/prerendering, so a crawler that doesn't execute JS
// never sees any of this - genuine crawler-visible SEO would need SSR,
// which is a pre-existing, whole-app limitation this hook doesn't attempt
// to fix. It's still worth doing: it's what a JS-executing crawler (Google)
// and social-share unfurlers that run headless browsers actually read, and
// it's the honest, no-new-dependency option (matches this app's established
// preference - plain grid over embla, native <video> over a player library).
function upsertMetaTag(attr, attrValue, content) {
  let tag = document.head.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonicalLink(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function useSeo({ title, description, canonical } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;
    if (description) upsertMetaTag('name', 'description', description);
    if (canonical) upsertCanonicalLink(canonical);

    // Restore the previous title on unmount - a page that navigates away
    // shouldn't leave the next page's tab title stuck on this one's.
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonical]);
}
