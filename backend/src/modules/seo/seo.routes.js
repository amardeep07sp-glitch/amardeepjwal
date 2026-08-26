import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { buildSitemapXml, buildRobotsTxt } from './sitemap.service.js';

// Mounted directly on the app (app.js), NOT under /api/v1 - a crawler
// always requests /sitemap.xml and /robots.txt at the site's own domain
// root (that's the sitemap protocol's and robots.txt's actual spec, not a
// convention this app invented). In production this means whatever
// reverse proxy/host serves the storefront's public domain (SITE_URL)
// must route these two paths to this backend, the same way it already
// needs to route /api/* here - see apikey.todo's CORS_ORIGIN/SITE_URL
// entry for that same deployment requirement.
const router = Router();

router.get(
  '/sitemap.xml',
  asyncHandler(async (req, res) => {
    const xml = await buildSitemapXml(env.SITE_URL);
    res.set('Content-Type', 'application/xml');
    res.status(200).send(xml);
  })
);

router.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.status(200).send(buildRobotsTxt(env.SITE_URL));
});

// A crawler hitting a broken /sitemap.xml should see an empty 500, never
// this app's JSON error envelope (a crawler doesn't parse JSON) - this
// router's own error handler intercepts before the global one gets a
// chance to.
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  logger.error({ err: err.message }, 'Sitemap/robots generation failed');
  res.status(500).type('text/plain').send('');
});

export default router;
