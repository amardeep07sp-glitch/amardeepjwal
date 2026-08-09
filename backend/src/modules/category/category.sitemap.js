// Minimal XML escaping - category name/slug are the only values interpolated
// into the document, but a name containing "&" or "<" would otherwise
// produce invalid XML.
const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));

// Only categories that are actually meant to be found should be crawled -
// draft/hidden/archived ones or ones explicitly hidden from the storefront.
export const buildCategorySitemapXml = (categories, siteUrl) => {
  const urlEntries = categories
    .filter((category) => category.status === 'published' && category.isVisible)
    .map((category) => {
      const loc = escapeXml(`${siteUrl}/category/${category.slug}`);
      const lastmod = new Date(category.updatedAt).toISOString();
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
};
