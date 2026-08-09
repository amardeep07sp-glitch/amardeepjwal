import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation the way a
// traditional multi-page site does - without this, a new page (or the
// same page's next paginated view) renders already scrolled to wherever
// the previous one was left, instead of opening at the top. Mounted once,
// globally, in App.jsx - every route change resets it, not just the ones
// a page author remembered to handle locally.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
