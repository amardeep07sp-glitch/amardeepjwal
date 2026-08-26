// Creates the real "Mudrika" Brand document (Admin -> Catalog -> Brands)
// with its full showcase content (brand.model.js#showcase) - the flagship
// brand page (client/src/pages/MudrikaPage.jsx) reads everything from this
// record instead of the hardcoded copy/arrays it used to ship with, so an
// admin can edit any of it later without a code change.
//
// The hero/story/craft-process/trust-benefit copy below is the genuine
// copy the page already shipped with - moved into the database, not
// invented fresh. What this script does NOT do: assign any existing
// Product to this brand. Which of the store's real ring products belong
// under the Mudrika line is a catalog decision for whoever manages the
// storefront - do that from Admin -> Catalog -> Products (each product's
// own Brand field) once this brand exists to assign.
//
// Idempotent: upserts by slug, safe to re-run.
// Usage: node scripts/seedMudrikaBrand.js
import { connectDB, disconnectDB } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { Brand } from '../src/modules/brand/brand.model.js';
import { CATALOG_STATUSES } from '../src/constants/catalog.js';

const MUDRIKA = {
  name: 'Mudrika',
  slug: 'mudrika',
  description:
    "Amardeep Swarna Kala Kendra's flagship in-house line of 22K/18K royal gold rings, heritage Polki Jadau, solitaires, and bespoke bridal jewellery, handcrafted by master karigars.",
  country: 'India',
  status: CATALOG_STATUSES.PUBLISHED,
  isFeatured: true,
  isVisible: true,
  order: 0,
  showcase: {
    heroTagline: 'The Art of Regal Adornment',
    heroLocalName: 'मुद्रिका',
    storyTitle: 'Where Sacred Tradition Meets Modern Royalty',
    storyBody:
      "In ancient Sanskrit, Mudrika (मुद्रिका) signifies the royal signet ring - a symbol of supreme identity, sacred vows, and sovereign grace. We founded the Mudrika brand under Amardeep Swarna Kala Kendra to revive this majestic legacy for modern celebrations.\n\nEvery single piece in the Mudrika collection undergoes over 40 hours of meticulous hand-setting by our hereditary master karigars. Blending centuries-old Kundan, Polki, and Nakashi carving with contemporary structural ergonomics, Mudrika ornaments feel feather-light on the skin while radiating unmistakable grandeur.",
    editions: [
      { name: 'Royal Mudrika Rings', localName: 'राजसी मुद्रिका', tagline: 'Signature Handcrafted Finger Rings', categorySlug: 'ring' },
    ],
    craftPillars: [
      {
        title: 'Heritage Conception',
        icon: 'Compass',
        description:
          'Every Mudrika masterpiece begins with historic Vedic motifs, hand-sketched to complement the natural curvature of the hand.',
      },
      {
        title: '22K & 18K Fine Metallurgy',
        icon: 'Award',
        description:
          'Cast exclusively in certified 916 purity hallmark gold alloyed for supreme luster, structural resilience, and everlasting value.',
      },
      {
        title: 'Master Karigar Jadau',
        icon: 'Sparkles',
        description:
          'Uncut polki and hand-selected gems are mounted with microscopic prong precision without synthetic adhesives or artificial fillers.',
      },
      {
        title: 'Mirror Lustre & Laser Stamping',
        icon: 'Crown',
        description:
          'Triple-buffed to a liquid-gold finish and laser-inscribed with BIS hallmarking and our signature House of Amardeep emblem.',
      },
    ],
    trustBenefits: [
      { title: '100% BIS Hallmarked', icon: 'ShieldCheck', description: 'Certified 22K (916) and 18K (750) gold guaranteed with government certification.' },
      { title: 'Lifetime Exchange & Buyback', icon: 'RotateCcw', description: 'Full transparency value guarantee backed by Amardeep Kala Kendra across generations.' },
      { title: 'Insured Doorstep Delivery', icon: 'Truck', description: 'Tamper-proof transit insurance with secure verification right to your hands.' },
      { title: 'Complimentary Care & Polish', icon: 'Sparkles', description: 'Lifetime annual ultrasonic cleaning and prong inspection for all Mudrika owners.' },
    ],
  },
  seo: {
    metaTitle: 'MUDRIKA — Signature Royal Jewellery Brand | Amardeep Swarna Kala Kendra',
    metaDescription:
      'Explore Mudrika by Amardeep: An exclusive flagship collection of 22K/18K royal gold rings, heritage polki jadau, solitaires, and bespoke bridal jewelry handcrafted by master karigars.',
  },
};

async function run() {
  await connectDB();

  const existing = await Brand.findOne({ slug: MUDRIKA.slug });
  if (existing) {
    logger.info('[seed] Brand "mudrika" already exists - leaving it untouched (edit it from Admin -> Catalog -> Brands instead).');
  } else {
    await Brand.create(MUDRIKA);
    logger.info('[seed] Created brand "mudrika" with full showcase content.');
    logger.info(
      '[seed] NOTE: no products were assigned to this brand - do that from Admin -> Catalog -> Products (each product\'s Brand field) for whichever real ring products belong in the Mudrika line. It also has no logo/banner/hero/story image yet - add those from Admin -> Catalog -> Brands.'
    );
  }

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  logger.error({ err: err.message }, '[seed] Failed to seed Mudrika brand');
  process.exit(1);
});
