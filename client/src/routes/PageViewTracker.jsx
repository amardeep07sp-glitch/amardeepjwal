import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { trackPageView, endSession } from '@/lib/analytics';

// Routes that fire their OWN, funnel-specific event type from the page
// itself (category_view/product_view/collection_view - see cip.constants.js
// FUNNEL_STEPS) instead of a generic page_view - firing both here too would
// double-count that step. Every other route gets a plain page_view with an
// inferred pageType, which is what feeds Session/Journey/Bounce analytics
// for the pages that aren't a named funnel step.
const DEDICATED_EVENT_ROUTES = ['/category/:slug', '/products/:slug', '/collections/:slug'];

const PAGE_TYPE_BY_PATH = [
  { path: '/', pageType: 'home' },
  { path: '/products', pageType: 'all_products' },
  { path: '/new-arrivals', pageType: 'new_arrivals' },
  { path: '/offers', pageType: 'offers' },
  { path: '/categories', pageType: 'all_categories' },
  { path: '/collections', pageType: 'collections' },
  { path: '/search', pageType: 'search' },
  { path: '/login', pageType: 'auth' },
];

function resolvePageType(pathname) {
  const match = PAGE_TYPE_BY_PATH.find((entry) => matchPath({ path: entry.path, end: true }, pathname));
  return match?.pageType ?? 'other';
}

// Mounted once, globally, in App.jsx - same "every route change, not just
// the ones a page author remembered" precedent as ScrollToTop.jsx.
export function PageViewTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isDedicated = DEDICATED_EVENT_ROUTES.some((pattern) => matchPath(pattern, pathname));
    if (!isDedicated) trackPageView(resolvePageType(pathname));
  }, [pathname]);

  // Closes the session out with a real end time/duration server-side
  // instead of leaving every tab-close to the 30-minute idle sweep to
  // guess at - `pagehide` fires reliably on mobile Safari where
  // `beforeunload` often doesn't.
  useEffect(() => {
    window.addEventListener('pagehide', endSession);
    return () => window.removeEventListener('pagehide', endSession);
  }, []);

  return null;
}
