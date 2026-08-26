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

// Facebook/WhatsApp/Twitter/LinkedIn link-preview unfurlers each read a
// different (overlapping) meta tag set, and critically most of them do
// NOT execute JavaScript at all (unlike Googlebot) - a share of a product/
// collection URL from this CSR app would otherwise unfurl with nothing but
// index.html's static generic defaults, never this specific page's real
// title/image. Setting og:*/twitter:* here is what makes that upgrade to a
// per-page image/title actually show up for a JS-executing crawler
// (Googlebot, and any preview bot that does render) - the honest ceiling
// for a page not doing SSR (see this file's own header comment).
function upsertOgTags({ title, description, image, url }) {
  if (title) {
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('name', 'twitter:title', title);
  }
  if (description) {
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('name', 'twitter:description', description);
  }
  if (image) {
    upsertMetaTag('property', 'og:image', image);
    upsertMetaTag('name', 'twitter:image', image);
  }
  if (url) upsertMetaTag('property', 'og:url', url);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
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

// A single, fixed <script id="seo-json-ld"> slot - only one structured-data
// block is ever meaningful per page (Product on a PDP, BreadcrumbList on a
// listing, ...), so this replaces rather than accumulates. Removed
// entirely (not left as `{}`) when a page passes no jsonLd, so navigating
// from a Product page to a plain page doesn't leave stale Product schema
// behind for a crawler to misread.
const JSON_LD_ID = 'seo-json-ld';

function upsertJsonLd(data) {
  const existing = document.getElementById(JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const script = existing ?? document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data });
  if (!existing) document.head.appendChild(script);
}

export function useSeo({ title, description, canonical, image, jsonLd } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;
    if (description) upsertMetaTag('name', 'description', description);
    if (canonical) upsertCanonicalLink(canonical);
    upsertOgTags({ title, description, image, url: canonical || window.location.href });
    upsertJsonLd(jsonLd);

    // Restore the previous title on unmount - a page that navigates away
    // shouldn't leave the next page's tab title stuck on this one's.
    return () => {
      document.title = previousTitle;
      upsertJsonLd(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, image, JSON.stringify(jsonLd)]);
}
