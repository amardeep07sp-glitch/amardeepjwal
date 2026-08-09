import { Link } from 'react-router-dom';

const isExternal = (href) => /^https?:\/\//i.test(href ?? '');

// CMS-authored link fields (Banner.linkUrl) can be an internal route
// ("/products") or a real external URL (an Instagram post, a WhatsApp
// catalog link, etc.) - react-router's <Link> would mangle an external
// URL by treating it as a relative path. This picks the right tag.
export function SmartLink({ to, children, ...props }) {
  if (isExternal(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}
