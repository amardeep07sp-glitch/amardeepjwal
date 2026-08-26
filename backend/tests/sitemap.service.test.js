import { jest } from '@jest/globals';

// sitemap.service.js queries the real Mongoose models directly (there's no
// repository layer for a read this simple) - each mock replicates the
// exact .find().select().lean() chain it calls, resolving to a fixture
// array instead of hitting a real database.
function mockModel(fixture) {
  return { find: jest.fn(() => ({ select: () => ({ lean: () => Promise.resolve(fixture) }) })) };
}

const mockProduct = mockModel([{ slug: 'gold-ring', updatedAt: new Date('2026-01-01') }]);
const mockCategory = mockModel([{ slug: 'rings', updatedAt: new Date('2026-01-02') }]);
const mockBrand = mockModel([{ slug: 'mudrika', updatedAt: new Date('2026-01-03') }]);
const mockPage = mockModel([{ slug: 'privacy-policy', updatedAt: new Date('2026-01-04') }]);

jest.unstable_mockModule('../src/modules/product/product.model.js', () => ({ Product: mockProduct }));
jest.unstable_mockModule('../src/modules/category/category.model.js', () => ({ Category: mockCategory }));
jest.unstable_mockModule('../src/modules/brand/brand.model.js', () => ({ Brand: mockBrand }));
jest.unstable_mockModule('../src/modules/page/page.model.js', () => ({ Page: mockPage }));

const { buildSitemapXml, buildRobotsTxt } = await import('../src/modules/seo/sitemap.service.js');

const SITE_URL = 'https://www.example-store.test';

describe('buildSitemapXml', () => {
  it('includes every real product/category/brand/page URL with the site URL prefixed', async () => {
    const xml = await buildSitemapXml(SITE_URL);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(`<loc>${SITE_URL}/products/gold-ring</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/category/rings</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/brand/mudrika</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/pages/privacy-policy</loc>`);
  });

  it('includes the fixed static routes (homepage, /products, ...) alongside DB-backed ones', async () => {
    const xml = await buildSitemapXml(SITE_URL);
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/products</loc>`);
  });

  it('writes a real ISO lastmod for every DB-backed entry', async () => {
    const xml = await buildSitemapXml(SITE_URL);
    expect(xml).toContain('<lastmod>2026-01-01T00:00:00.000Z</lastmod>');
  });

  it('escapes XML-unsafe characters in a slug rather than emitting invalid XML', async () => {
    mockProduct.find.mockReturnValueOnce({ select: () => ({ lean: () => Promise.resolve([{ slug: 'a&b', updatedAt: new Date() }]) }) });
    const xml = await buildSitemapXml(SITE_URL);
    expect(xml).toContain(`${SITE_URL}/products/a&amp;b`);
    expect(xml).not.toContain('a&b<');
  });
});

describe('buildRobotsTxt', () => {
  it('points crawlers at the real sitemap URL', () => {
    const robots = buildRobotsTxt(SITE_URL);
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it('disallows every account-scoped/private route, never the public catalog', () => {
    const robots = buildRobotsTxt(SITE_URL);
    expect(robots).toContain('Disallow: /checkout');
    expect(robots).toContain('Disallow: /cart');
    expect(robots).toContain('Disallow: /orders');
    expect(robots).not.toContain('Disallow: /products');
    expect(robots).toContain('Allow: /');
  });
});
