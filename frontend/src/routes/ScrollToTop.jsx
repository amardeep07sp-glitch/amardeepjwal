import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation the way a
// traditional multi-page site does - without this, a new page can render
// already scrolled to wherever the previous page was left. Resets both the
// window and the admin layout's own scroll container (the <main> panel
// scrolls independently of the window on some viewports) on every route
// change.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('admin-main-scroll')?.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
