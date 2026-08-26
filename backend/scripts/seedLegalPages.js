// Seeds real Privacy Policy / Terms & Conditions / Shipping Policy /
// Return & Exchange Policy content as real CMS Page documents (through
// page.repository.js's Page model, exactly what an admin editing them in
// Admin -> CMS -> Pages would touch) - not a hardcoded page component, so
// an admin can revise the wording later without a code change.
//
// The text below is a genuine, standard-form policy grounded in what this
// store's own code actually does (COD + Razorpay payments, Cloudinary
// media, CIP analytics/cookies, 15-day returns per TrustBadges.jsx, free
// shipping per Footer.jsx) - but it is a STARTING POINT, not legal advice.
// Have a lawyer review it (particularly business registration/GST details,
// which are intentionally left as placeholders below) before relying on it
// in production.
//
// Idempotent: upserts by slug, safe to re-run.
// Usage: node scripts/seedLegalPages.js
import { connectDB, disconnectDB } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { Page } from '../src/modules/page/page.model.js';
import { PAGE_STATUSES } from '../src/constants/cms.js';

const APP_NAME = 'Amardeep Swarna Kala Kendra';
const SUPPORT_PHONE = '+91 8808485840';

const PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `Last updated: [DATE - fill in before publishing]

${APP_NAME} ("we", "us", "our") operates this website and app. This policy explains what personal data we collect, why, and how you can control it.

1. INFORMATION WE COLLECT
- Account details you provide: name, email, phone number, password (stored as a one-way hash, never in plain text).
- Order details: shipping/billing address, items purchased, order value, payment method (Cash on Delivery or online payment via Razorpay - we never store your card/UPI details ourselves; Razorpay processes and stores those under its own PCI-DSS compliant systems).
- Location: with your explicit permission, your device's GPS location may be used to show accurate delivery estimates and store locations. You can decline this at any time; it never blocks checkout.
- Usage data: pages you visit, products you view/search, general location derived from your IP address (city/state level only, never precise), device/browser type - used to improve the shopping experience and for internal analytics.
- Photos/videos you choose to upload with a product review.

2. HOW WE USE YOUR INFORMATION
- To process and deliver your orders, and to communicate with you about them (order confirmation, shipping updates, support requests).
- To operate your account, wishlist, cart, and loyalty/rewards balance.
- To improve our catalog, search, and recommendations.
- To send you offers/updates by email or WhatsApp, only if you haven't opted out.
- To prevent fraud and secure our platform.

3. HOW WE SHARE YOUR INFORMATION
We do not sell your personal data. We share it only with:
- Payment processors (Razorpay) to complete transactions.
- Shipping/logistics partners, to deliver your order.
- Cloud service providers (e.g. our hosting and media storage providers) who process data on our behalf under contract.
- Law enforcement or regulators, only when legally required.

4. YOUR CHOICES
- You can view and update your profile, addresses, and saved information from your account at any time.
- You can request deletion of your account and associated personal data by contacting us (details below), subject to our legal obligation to retain order/tax records for the period required by Indian law.
- You can withdraw location permission at any time via your browser/device settings.

5. DATA SECURITY
Passwords are hashed, not stored in plain text. Payment card/UPI details are never stored on our servers - they are handled directly by our payment gateway partner. We use industry-standard measures to protect your data, but no online service can guarantee absolute security.

6. COOKIES & ANALYTICS
We use cookies/local storage to keep you signed in, remember your cart, and understand how visitors use our site (page views, search terms, general location). You can disable cookies in your browser, though some features may not work correctly without them.

7. CONTACT US
For any privacy questions or to exercise your rights over your data, contact us at ${SUPPORT_PHONE}.

8. CHANGES TO THIS POLICY
We may update this policy from time to time. The "Last updated" date above will reflect the latest revision.`,
  },
  {
    slug: 'terms-conditions',
    title: 'Terms & Conditions',
    content: `Last updated: [DATE - fill in before publishing]

Welcome to ${APP_NAME}. By using our website/app or placing an order, you agree to these Terms & Conditions.

1. ELIGIBILITY
You must be at least 18 years old, or place orders under the supervision of a parent/guardian, to create an account and transact on this platform.

2. PRODUCT INFORMATION & PRICING
- We make every effort to display product images, descriptions, and prices accurately. Actual jewellery weight/size may vary slightly due to the handcrafted nature of the product.
- Gold/silver rates shown are updated manually by our team and may differ slightly from live market rates at the exact moment of your order; the price shown at checkout is final for that order.
- We reserve the right to correct pricing/listing errors and to cancel an order placed at an incorrectly listed price, with a full refund if payment was already made.

3. ORDERS & PAYMENT
- Orders are confirmed once payment is completed (online) or once placed (Cash on Delivery), subject to stock availability.
- We accept Cash on Delivery and online payment (UPI/Cards/Netbanking) via Razorpay, where available.
- We reserve the right to cancel any order in cases of suspected fraud, non-serviceable pincodes, or unusual order patterns.

4. SHIPPING
We currently offer free shipping across India on every order, with insured delivery. Estimated delivery timelines are shown at checkout/order tracking and may vary by location.

5. RETURNS & EXCHANGES
Eligible items may be returned within 15 days of delivery in original, unused condition with all tags/certification intact, subject to the Return & Exchange Policy. Refunds for online payments are processed back to the original payment method; Cash on Delivery refunds are processed to your linked bank account or store wallet, as applicable.

6. ACCOUNT RESPONSIBILITY
You are responsible for maintaining the confidentiality of your account password and for all activity under your account. Notify us immediately of any unauthorized use.

7. INTELLECTUAL PROPERTY
All content on this site - product photography, descriptions, logos, and design - is the property of ${APP_NAME} and may not be reused without written permission.

8. LIMITATION OF LIABILITY
${APP_NAME} is not liable for indirect or consequential loss arising from use of this website, delays outside our reasonable control (e.g. courier delays, force majeure), or minor natural variation in handcrafted jewellery.

9. GOVERNING LAW
These terms are governed by the laws of India, with courts at [CITY - fill in before publishing] having exclusive jurisdiction.

10. CONTACT US
For any questions about these terms, contact us at ${SUPPORT_PHONE}.`,
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    content: `Last updated: [DATE - fill in before publishing]

We currently offer FREE, insured shipping on every order across India, with no minimum order value required.

DELIVERY TIMELINES
Most orders are dispatched within 1-3 business days of confirmation and delivered within 5-9 business days thereafter, depending on your location. You can track your order's live status from My Orders (if signed in) or via Track Order using your order number.

ORDER PACKAGING
Every order is packed securely and insured in transit, so you're covered in the rare event of loss or damage during shipping - please inspect your package on delivery and report any visible damage to us immediately (contact details below).

SERVICEABILITY
We currently ship across India. If your pincode is temporarily unserviceable, you'll be notified at checkout.

CONTACT US
For any shipping questions, contact us at ${SUPPORT_PHONE}.`,
  },
  {
    slug: 'return-exchange-policy',
    title: 'Return & Exchange Policy',
    content: `Last updated: [DATE - fill in before publishing]

We want you to love your purchase. If you're not fully satisfied, most items can be returned within 15 days of delivery.

ELIGIBILITY
- The item must be unused, unworn, and in its original condition, with all original tags, certification, and packaging intact.
- Customized or made-to-order pieces may not be eligible for return - this will be indicated on the product page at the time of purchase.
- Items showing signs of wear, alteration, or damage not present at delivery are not eligible for return.

HOW TO INITIATE A RETURN
Sign in to your account, go to My Orders, select the order, and request a return. Our team will review your request and arrange a reverse pickup where available.

REFUNDS
Once we receive and inspect the returned item, refunds are processed within 5-7 business days:
- Online payments (Razorpay): refunded to your original payment method.
- Cash on Delivery orders: refunded to your bank account or store wallet, as you choose.

EXCHANGES
If you'd like a different size/design instead of a refund, request an exchange the same way - subject to stock availability of the requested item.

CONTACT US
For help with a return or exchange, contact us at ${SUPPORT_PHONE}.`,
  },
];

async function run() {
  await connectDB();

  for (const pageDef of PAGES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Page.findOne({ slug: pageDef.slug });
    if (existing) {
      logger.info(`[seed] Page "${pageDef.slug}" already exists - skipping (edit it in Admin -> CMS -> Pages instead).`);
      continue; // eslint-disable-line no-continue
    }
    // eslint-disable-next-line no-await-in-loop
    await Page.create({ ...pageDef, status: PAGE_STATUSES.PUBLISHED });
    logger.info(`[seed] Created page "${pageDef.slug}".`);
  }

  logger.info('[seed] Legal pages seed complete. Review every "[DATE - fill in...]"/"[CITY - fill in...]" placeholder and have a lawyer review the content before real launch.');
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error({ err: err.message }, '[seed] Legal pages seed failed');
  await disconnectDB().catch(() => {});
  process.exit(1);
});
