import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  MEDIA_MAX_IMAGE_SIZE_MB: z.coerce.number().default(10),
  MEDIA_MAX_VIDEO_SIZE_MB: z.coerce.number().default(100),

  RESEND_API_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),

  // "Sign in with Google" (auth.service.js#loginWithGoogle) - only the
  // Client ID is needed server-side, to verify the `aud` claim on the ID
  // token Google Identity Services hands the browser. No client secret
  // involved (this is the ID-token flow, not a server-side OAuth
  // redirect/code exchange) - see apikey.todo.
  GOOGLE_CLIENT_ID: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // Public storefront origin - used to build absolute canonical URLs and
  // JSON-LD ids (category schema markup, sitemap). Defaults to CORS_ORIGIN's
  // value since in dev they're the same app.
  SITE_URL: z.string().default('http://localhost:5173'),

  DEV_SEED_PHONE: z.string().default('8888888888'),
  DEV_SEED_PASSWORD: z.string().default('123456'),

  // Fraud/risk guard on Cash on Delivery, launch-readiness audit gap #6 -
  // optional and unset by default (no limit, today's exact behavior) since
  // online payment (Razorpay) is currently commented out in the checkout UI
  // (client/src/pages/CheckoutPage.jsx) - enforcing a COD cap with no
  // alternative payment method would just make high-value orders
  // unplaceable. Set this once Razorpay is back online.
  COD_MAX_ORDER_VALUE: z.coerce.number().positive().optional(),

  // Customer Intelligence Platform's Data Retention Policy - raw Event
  // documents are TTL-expired after this many days (see event.model.js).
  // Aggregated reports only ever need a bounded recent window; long-term
  // trend storage is a future rollup job's concern, not this collection's.
  CIP_EVENT_RETENTION_DAYS: z.coerce.number().default(180),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
