// Seeds a real, production-ready starter catalog (categories + products,
// each with full jewellery pricing and real opening stock) through the
// actual service layer - not raw Mongo inserts - so every business rule
// (SKU generation, category product-count, inventory provisioning, price
// calculation) runs exactly as it would for an admin using the panel.
//
// Idempotent: re-running skips any category/product that already exists
// (matched by slug), so it's safe to run again after adding more entries
// below.
//
// Usage:  node scripts/seedCatalog.js
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { slugify } from '../src/utils/slugify.js';
import { User } from '../src/modules/auth/auth.model.js';
import { Product } from '../src/modules/product/product.model.js';
import { ROLES } from '../src/constants/roles.js';
import { categoryService } from '../src/modules/category/category.service.js';
import { categoryRepository } from '../src/modules/category/category.repository.js';
import { productService } from '../src/modules/product/product.service.js';
import { productRepository } from '../src/modules/product/product.repository.js';
import { pricingService } from '../src/modules/product/pricing/pricing.service.js';
import { inventoryRepository } from '../src/modules/inventory/inventory.repository.js';
import { inventoryLedgerService } from '../src/modules/inventory/inventoryLedger.service.js';
import { MOVEMENT_TYPES } from '../src/modules/inventory/inventory.constants.js';
import { warehouseService } from '../src/modules/inventory/warehouse.service.js';

const CATEGORIES = [
  { name: 'Rings' },
  { name: 'Necklaces' },
  { name: 'Earrings' },
  { name: 'Bangles' },
  { name: 'Bracelets' },
  { name: 'Pendants' },
  { name: 'Gifts' },
];

// Two per category - varied on purpose: some featured, one deliberately
// low-stock (exercises the "Only N left!" badge) and one deliberately
// out-of-stock (exercises that badge too), so the storefront isn't just
// showing 14 identical "everything's fine" cards.
const PRODUCTS = {
  Rings: [
    {
      name: 'Radiant Solitaire Gold Ring',
      shortDescription: 'An elegant solitaire-style gold ring for everyday grace.',
      description: 'Crafted in 22KT gold with a timeless solitaire setting - a versatile pick for daily wear or gifting.',
      isFeatured: true,
      stock: 12,
      pricing: { costPrice: 38000, mrp: 45000, discountType: 'percentage', discountValue: 5, taxPercentage: 3, makingCharges: 12, makingChargeType: 'percentage', wastagePercentage: 4, goldRateSnapshot: 6200 },
    },
    {
      name: 'Kundan Cocktail Ring',
      shortDescription: 'A statement Kundan-work cocktail ring.',
      description: 'Intricate Kundan work set in gold, designed to be the centerpiece of a festive or bridal look.',
      stock: 3,
      pricing: { costPrice: 55000, mrp: 68000, discountType: 'percentage', discountValue: 8, taxPercentage: 3, makingCharges: 18, makingChargeType: 'percentage', wastagePercentage: 6, stoneCost: 4500, goldRateSnapshot: 6200 },
    },
  ],
  Necklaces: [
    {
      name: 'Floral Filigree Gold Necklace',
      shortDescription: 'Delicate floral filigree work in 22KT gold.',
      description: 'A hand-finished floral filigree necklace that pairs equally well with festive and everyday outfits.',
      isFeatured: true,
      stock: 6,
      pricing: { costPrice: 92000, mrp: 110000, discountType: 'percentage', discountValue: 10, taxPercentage: 3, makingCharges: 14, makingChargeType: 'percentage', wastagePercentage: 5, goldRateSnapshot: 6200 },
    },
    {
      name: 'Temple Design Gold Necklace',
      shortDescription: 'Traditional temple-inspired gold necklace.',
      description: 'South Indian temple-jewellery motifs, hand-finished in gold - a bridal and festive staple.',
      stock: 8,
      pricing: { costPrice: 135000, mrp: 158000, taxPercentage: 3, makingCharges: 16, makingChargeType: 'percentage', wastagePercentage: 6, goldRateSnapshot: 6200 },
    },
  ],
  Earrings: [
    {
      name: 'Pearl Drop Gold Earrings',
      shortDescription: 'Freshwater pearl drops on gold studs.',
      description: 'Lightweight gold studs finished with freshwater pearl drops - easy everyday elegance.',
      stock: 15,
      pricing: { costPrice: 21000, mrp: 25500, discountType: 'percentage', discountValue: 6, taxPercentage: 3, makingCharges: 10, makingChargeType: 'percentage', wastagePercentage: 3, stoneCost: 800, goldRateSnapshot: 6200 },
    },
    {
      name: 'Kundan Jhumka Earrings',
      shortDescription: 'Classic Kundan jhumkas for festive wear.',
      description: 'Traditional bell-shaped jhumkas with Kundan and bead detailing.',
      isFeatured: true,
      stock: 0,
      pricing: { costPrice: 26000, mrp: 32000, discountType: 'percentage', discountValue: 12, taxPercentage: 3, makingCharges: 15, makingChargeType: 'percentage', wastagePercentage: 5, stoneCost: 1200, goldRateSnapshot: 6200 },
    },
  ],
  Bangles: [
    {
      name: 'Traditional Gold Bangles (Set of 2)',
      shortDescription: 'A matching pair of traditional gold bangles.',
      description: 'Hand-finished traditional bangles sold as a matching pair - a wedding and festive essential.',
      stock: 5,
      pricing: { costPrice: 118000, mrp: 138000, discountType: 'percentage', discountValue: 5, taxPercentage: 3, makingCharges: 13, makingChargeType: 'percentage', wastagePercentage: 5, goldRateSnapshot: 6200 },
    },
    {
      name: 'Antique Finish Gold Bangle',
      shortDescription: 'A single antique-finish gold bangle.',
      description: 'An oxidised antique finish gives this bangle a heritage look that pairs well with ethnic wear.',
      stock: 10,
      pricing: { costPrice: 58000, mrp: 68000, taxPercentage: 3, makingCharges: 14, makingChargeType: 'percentage', wastagePercentage: 5, goldRateSnapshot: 6200 },
    },
  ],
  Bracelets: [
    {
      name: 'Chain Link Gold Bracelet',
      shortDescription: 'A sleek chain-link gold bracelet.',
      description: 'A minimal, sturdy chain-link bracelet finished to a high polish.',
      stock: 18,
      pricing: { costPrice: 24000, mrp: 28500, discountType: 'percentage', discountValue: 5, taxPercentage: 3, makingCharges: 10, makingChargeType: 'percentage', wastagePercentage: 3, goldRateSnapshot: 6200 },
    },
    {
      name: 'Charm Gold Bracelet',
      shortDescription: 'A dainty charm-detail gold bracelet.',
      description: 'Delicate gold charms along a fine chain - a versatile everyday layering piece.',
      stock: 14,
      pricing: { costPrice: 19500, mrp: 23000, taxPercentage: 3, makingCharges: 11, makingChargeType: 'percentage', wastagePercentage: 3, goldRateSnapshot: 6200 },
    },
  ],
  Pendants: [
    {
      name: 'Lotus Gold Pendant',
      shortDescription: 'A lotus-motif gold pendant.',
      description: 'A finely detailed lotus pendant in 22KT gold, sold without chain.',
      isFeatured: true,
      stock: 9,
      pricing: { costPrice: 16000, mrp: 19500, discountType: 'percentage', discountValue: 7, taxPercentage: 3, makingCharges: 12, makingChargeType: 'percentage', wastagePercentage: 4, goldRateSnapshot: 6200 },
    },
    {
      name: 'Om Symbol Gold Pendant',
      shortDescription: 'A compact Om-symbol gold pendant.',
      description: 'A compact, everyday-wearable Om pendant in polished gold.',
      stock: 20,
      pricing: { costPrice: 9500, mrp: 11500, taxPercentage: 3, makingCharges: 10, makingChargeType: 'percentage', wastagePercentage: 3, goldRateSnapshot: 6200 },
    },
  ],
  Gifts: [
    {
      name: 'Gold Coin 1 Gram - Lakshmi Motif',
      shortDescription: 'A 1 gram, 24KT gold coin with a Lakshmi motif.',
      description: 'A 24KT, 1 gram gold coin featuring a Lakshmi motif - a popular gifting choice for festivals and occasions.',
      stock: 25,
      pricing: { costPrice: 6500, mrp: 7200, taxPercentage: 3, makingCharges: 200, makingChargeType: 'fixed', goldRateSnapshot: 6500 },
    },
    {
      name: 'Earring & Pendant Gift Set',
      shortDescription: 'A matching earring and pendant set, gift-boxed.',
      description: 'A coordinated earring and pendant set presented in a gift box - ready to give.',
      isFeatured: true,
      stock: 7,
      pricing: { costPrice: 32000, mrp: 38500, discountType: 'percentage', discountValue: 8, taxPercentage: 3, makingCharges: 13, makingChargeType: 'percentage', wastagePercentage: 4, goldRateSnapshot: 6200 },
    },
  ],
};

// pricingService.updatePricing is called directly here, bypassing the
// route's zod schema (which is what normally fills in every one of these
// defaults) - without them, an undefined discountValue/makingCharges/etc.
// reaches calculatePricePreview's arithmetic as NaN, silently corrupting
// the stored price. Every field pricing.validation.js's pricingBody
// defaults must be defaulted here too.
const PRICING_DEFAULTS = {
  discountType: 'percentage',
  discountValue: 0,
  taxIncluded: false,
  taxPercentage: 0,
  currency: 'INR',
  priceStatus: 'active',
  makingCharges: 0,
  makingChargeType: 'fixed',
  wastagePercentage: 0,
  goldRateSnapshot: 0,
  silverRateSnapshot: 0,
  stoneCost: 0,
  diamondCost: 0,
  labourCost: 0,
};

async function getSeedActor() {
  const devAdmin = await User.findOne({ phone: env.DEV_SEED_PHONE });
  if (devAdmin) return devAdmin;

  const anyAdmin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } });
  if (anyAdmin) return anyAdmin;

  throw new Error('No admin user found to attribute the seed to - run with NODE_ENV=development at least once first (seeds a dev admin), or create one manually.');
}

async function ensureCategory(actorId, { name }) {
  const slug = slugify(name);
  const existing = await categoryRepository.findBySlug(slug);
  if (existing) {
    logger.info(`[seed] category "${name}" already exists, skipping`);
    return existing;
  }

  const created = await categoryService.createCategory(
    { name, status: 'published', isVisible: true, showInNavbar: true, showOnHomepage: true },
    actorId
  );
  logger.info(`[seed] created category "${name}"`);
  return created;
}

async function ensureProduct(actorId, categoryId, entry) {
  const slug = slugify(entry.name);
  // A plain existence check by slug, regardless of status/pricing - unlike
  // findPublicBySlug (which requires published+priced), this must still
  // detect a product left half-seeded by a previous failed run.
  const existing = await Product.findOne({ slug });
  if (existing) {
    logger.info(`[seed] product "${entry.name}" already exists, skipping`);
    return;
  }

  const product = await productService.createProduct({
    name: entry.name,
    category: categoryId,
    status: 'published',
    isVisible: true,
    isFeatured: Boolean(entry.isFeatured),
    shortDescription: entry.shortDescription,
    description: entry.description,
  });

  await pricingService.updatePricing(
    product.id,
    {
      ...PRICING_DEFAULTS,
      sellingPrice: entry.pricing.mrp,
      ...entry.pricing,
      reason: 'Initial catalog seed',
    },
    actorId
  );

  if (entry.stock > 0) {
    const inventory = await inventoryRepository.findPaginated({
      page: 1,
      limit: 1,
      product: product.id,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    const inventoryRecord = inventory.items[0];
    if (inventoryRecord) {
      await inventoryLedgerService.recordMovement({
        inventoryId: inventoryRecord._id,
        movementType: MOVEMENT_TYPES.OPENING_STOCK,
        quantityChanged: entry.stock,
        reason: 'Initial catalog seed - opening stock',
        performedBy: actorId,
      });
    }
  }

  logger.info(`[seed] created product "${entry.name}" (stock: ${entry.stock})`);
}

async function run() {
  await connectDB();
  await warehouseService.ensureDefaultWarehouse();

  const actor = await getSeedActor();
  logger.info(`[seed] attributing seed data to ${actor.name} (${actor.email})`);

  for (const categoryDef of CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    const category = await ensureCategory(actor._id, categoryDef);
    const products = PRODUCTS[categoryDef.name] ?? [];
    for (const productDef of products) {
      // eslint-disable-next-line no-await-in-loop
      await ensureProduct(actor._id, category.id, productDef);
    }
  }

  logger.info('[seed] Catalog seed complete.');
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error({ err: err.message }, '[seed] Catalog seed failed');
  await disconnectDB().catch(() => {});
  process.exit(1);
});
