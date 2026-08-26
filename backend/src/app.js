import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import swaggerSpec from './config/swagger.js';
import { apiLimiter, eventLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';
import seoRoutes from './modules/seo/seo.routes.js';
import cipEventPublicRoutes from './modules/cip/event.public.routes.js';
import cipSessionPublicRoutes from './modules/cip/session.public.routes.js';
import cipPrivacyPublicRoutes from './modules/cip/privacy.public.routes.js';

const app = express();

// Without this, req.ip is always the reverse proxy's own address (a
// private/internal IP) in any real deployment sitting behind one (Nginx,
// a load balancer, most PaaS hosts) - geo.util.js#resolveLocationFromIp
// would then either resolve the proxy's own location for every visitor,
// or (if the proxy's IP is a private range) silently return no location
// at all, which is exactly the "wrong location detected" symptom this
// fixes. `1` trusts exactly one hop (the immediate proxy) and reads the
// real client IP from its X-Forwarded-For header - the standard, safe
// setting for a single reverse-proxy deployment (raise it only if a
// second proxy layer is added in front of that one).
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(compression());
// `verify` stashes the raw request bytes on req.rawBody - needed by
// orderPayment.routes.js's Razorpay webhook, whose signature is computed
// over the exact raw body (re-serializing req.body after JSON.parse can
// reorder/reformat keys and silently break HMAC verification).
app.use(
  express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssClean());

app.use(
  morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Root-level, unauthenticated - /sitemap.xml and /robots.txt must resolve
// at the site's own domain root per their respective specs, not under the
// /api/v1 prefix everything else uses (see seo.routes.js's header comment).
app.use(seoRoutes);

// Public, unauthenticated Customer Intelligence Platform endpoints - the
// tracking SDK calls these before a visitor has ever logged in. Mounted
// with their own dedicated eventLimiter, ahead of the general apiLimiter
// group below, so high-volume event ingestion is never governed by the
// same 300-per-15-minutes ceiling every authenticated admin route shares.
app.use('/api/v1/cip/events', eventLimiter, cipEventPublicRoutes);
app.use('/api/v1/cip/sessions', eventLimiter, cipSessionPublicRoutes);
app.use('/api/v1/cip/privacy', eventLimiter, cipPrivacyPublicRoutes);

app.use('/api/v1', apiLimiter, routes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// This API's own domain root has nothing for a browser to render (the real
// storefront/admin are separate apps) - but Render/most hosts ping "/" by
// default as their health check, which would otherwise 404 and log as an
// error on every deploy. A plain 200 here is what that check actually
// wants; anyone hitting this in a browser gets a clear "this is an API"
// message instead of a confusing 404.
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Amardeep Swarna Kala Kendra API is running' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
