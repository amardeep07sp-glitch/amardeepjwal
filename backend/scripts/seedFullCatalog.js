// Seeds a real, browsable starter catalog at production scale: nested
// categories (parent -> child), 100+ products spread across every leaf
// category, a handful of merchandising collections, category/product
// images, and homepage banners - all through the actual service layer
// (categoryService/productService/collectionService/pricingService/
// inventoryLedgerService), the same "not raw Mongo inserts" principle
// seedCatalog.js already follows, so every business rule (SKU generation,
// category product-count, inventory provisioning, price calculation)
// still runs exactly as it would for an admin using the panel.
//
// Images: real, freely-licensed stock photos (Unsplash License - free for
// commercial use, no attribution required), NOT scraped from Pinterest -
// Pinterest pins are almost always re-posts of someone else's copyrighted
// photography with no license attached, which is a real legal risk to bake
// into a real business's product catalog, even as placeholder seed data.
// Each distinct source photo is downloaded and uploaded to this store's own
// Cloudinary account exactly ONCE (see uploadOnce below), then that same
// Cloudinary asset is referenced by several Media documents (one per
// product/category/banner that uses it) - real, working images without
// spending 100+ separate Cloudinary uploads on a handful of repeated shots.
// Swap these for the shop's real product photography whenever it's ready -
// nothing else about the catalog structure depends on where the images
// came from.
//
// Idempotent: re-running skips any category/product/collection/banner that
// already exists (matched by slug/title), so it's safe to run again.
//
// Requires CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET to be set (backend/.env)
// - without them every image upload below fails; everything else (the
// categories/products/pricing/stock themselves) does not depend on them.
//
// Usage:  node scripts/seedFullCatalog.js
import { v4 as uuidv4 } from 'uuid';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { slugify } from '../src/utils/slugify.js';
import { User } from '../src/modules/auth/auth.model.js';
import { ROLES } from '../src/constants/roles.js';
import { GENDERS, OCCASIONS, JEWELLERY_METALS, GEMSTONE_TYPES } from '../src/constants/catalog.js';
import { BANNER_POSITIONS } from '../src/constants/cms.js';
import { Product } from '../src/modules/product/product.model.js';
import { Media } from '../src/modules/media/media.model.js';
import { Collection } from '../src/modules/collection/collection.model.js';
import { Banner } from '../src/modules/banner/banner.model.js';
import { categoryService } from '../src/modules/category/category.service.js';
import { categoryRepository } from '../src/modules/category/category.repository.js';
import { productService } from '../src/modules/product/product.service.js';
import { pricingService } from '../src/modules/product/pricing/pricing.service.js';
import { inventoryRepository } from '../src/modules/inventory/inventory.repository.js';
import { inventoryLedgerService } from '../src/modules/inventory/inventoryLedger.service.js';
import { MOVEMENT_TYPES } from '../src/modules/inventory/inventory.constants.js';
import { warehouseService } from '../src/modules/inventory/warehouse.service.js';
import { collectionService } from '../src/modules/collection/collection.service.js';
import { COLLECTION_TYPES, ASSIGNMENT_TYPES } from '../src/modules/collection/collection.constants.js';
import { uploadBufferToCloudinary, buildThumbnailUrl } from '../src/modules/media/media.cloudinary.js';
import { MEDIA_ENTITY_TYPES, MEDIA_TYPES } from '../src/modules/media/media.constants.js';

// --- Image pool --------------------------------------------------------
// One direct Unsplash CDN URL per distinct real photo, verified free
// (images.unsplash.com, not the paid plus.unsplash.com tier) before being
// added here. `w=1600&q=80` asks Unsplash's own resizer for a web-ready
// size at download time - no local image processing needed.
const SOURCE_IMAGES = {
  ring1: 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8', // emerald-cut engagement ring
  ring2: 'https://images.unsplash.com/photo-1654521883301-070279dd0ae1', // pair of gold rings
  ring3: 'https://images.unsplash.com/photo-1677466891766-703a8454158d', // statement gold ring
  necklace1: 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b', // necklace + earrings on stand
  necklace2: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846', // gold chain necklace
  earring1: 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3', // gold hoop earrings
  bangle1: 'https://images.unsplash.com/photo-1567567557645-8450247d194a', // gold bangles
  bracelet1: 'https://images.unsplash.com/photo-1684616289712-dd118c126fae', // gold chain bracelet
  giftbox1: 'https://images.unsplash.com/photo-1769116416641-e714b71851e8', // jewellery gift box
  bridal1: 'https://images.unsplash.com/photo-1673413350047-ea5c0fd58c9e', // bridal gold jewellery
};

const cloudinaryCache = new Map();

async function downloadImage(url) {
  const res = await fetch(`${url}?w=1600&q=80&auto=format&fit=crop`);
  if (!res.ok) throw new Error(`Failed to download seed image ${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Downloads + uploads a given source photo to this store's Cloudinary
// account exactly once per script run, no matter how many products/
// categories/banners end up referencing it below.
async function getCloudinarySnapshot(imageKey) {
  if (cloudinaryCache.has(imageKey)) return cloudinaryCache.get(imageKey);

  const buffer = await downloadImage(SOURCE_IMAGES[imageKey]);
  const publicId = uuidv4();
  const uploadResult = await uploadBufferToCloudinary(buffer, { folder: 'seed-catalog', publicId, resourceType: 'image' });

  const snapshot = {
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    thumbnailUrl: buildThumbnailUrl(uploadResult.public_id, 'image'),
    resourceType: uploadResult.resource_type,
    format: uploadResult.format ?? '',
    bytes: uploadResult.bytes ?? 0,
    width: uploadResult.width ?? null,
    height: uploadResult.height ?? null,
    duration: null,
    version: uploadResult.version ?? null,
    folder: 'seed-catalog',
    filename: uploadResult.public_id?.split('/').pop() ?? '',
    originalFilename: `${imageKey}.jpg`,
  };
  cloudinaryCache.set(imageKey, snapshot);
  logger.info(`[seed] uploaded source image "${imageKey}" to Cloudinary`);
  return snapshot;
}

// Attaches a new Media document to an already-created entity, reusing a
// cached Cloudinary asset (see getCloudinarySnapshot) - only called for
// entities this run actually just created, never for ones that already
// existed (that's what keeps this script idempotent: no new Media rows
// pile up on a second run).
async function attachImage(entityType, entityId, imageKey, actorId, { isFeatured = true, altText = '' } = {}) {
  const cloudinary = await getCloudinarySnapshot(imageKey);
  return Media.create({
    uuid: uuidv4(),
    entityType,
    entityId,
    type: MEDIA_TYPES.IMAGE,
    cloudinary,
    isFeatured,
    altText,
    createdBy: actorId,
    updatedBy: actorId,
  });
}

// --- Category tree -------------------------------------------------------
// Parent categories (existing shape from seedCatalog.js, extended with real
// nesting) - each gets 2-3 child categories, and products live on the
// children, not the parents (a parent page still shows them all via
// Category's recursive product count / descendant query).
const CATEGORY_TREE = [
  {
    name: 'Rings',
    icon: 'ring2',
    banner: 'ring1',
    children: [
      { name: 'Engagement Rings', noun: 'Engagement Ring', icon: 'ring1', banner: 'ring1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.ENGAGEMENT, OCCASIONS.WEDDING], gemstoneType: GEMSTONE_TYPES.DIAMOND, priceBase: 55000 },
      { name: 'Cocktail Rings', noun: 'Cocktail Ring', icon: 'ring3', banner: 'ring3', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.PARTY, OCCASIONS.FESTIVE], gemstoneType: GEMSTONE_TYPES.OTHER, priceBase: 42000 },
      { name: "Men's Rings", noun: "Men's Ring", icon: 'ring2', banner: 'ring2', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.MEN, occasions: [OCCASIONS.DAILY_WEAR, OCCASIONS.OFFICE_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 38000 },
    ],
  },
  {
    name: 'Necklaces',
    icon: 'necklace2',
    banner: 'necklace1',
    children: [
      { name: 'Chain Necklaces', noun: 'Chain Necklace', icon: 'necklace2', banner: 'necklace2', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.DAILY_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 65000 },
      { name: 'Choker Necklaces', noun: 'Choker Necklace', icon: 'necklace1', banner: 'necklace1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.PARTY, OCCASIONS.FESTIVE], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 78000 },
      { name: 'Temple Necklaces', noun: 'Temple Necklace', icon: 'bridal1', banner: 'bridal1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.WEDDING, OCCASIONS.FESTIVE], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 135000 },
    ],
  },
  {
    name: 'Earrings',
    icon: 'earring1',
    banner: 'earring1',
    children: [
      { name: 'Stud Earrings', noun: 'Stud Earrings', icon: 'earring1', banner: 'earring1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.DAILY_WEAR, OCCASIONS.OFFICE_WEAR], gemstoneType: GEMSTONE_TYPES.PEARL, priceBase: 18000 },
      { name: 'Jhumka Earrings', noun: 'Jhumka Earrings', icon: 'bridal1', banner: 'bridal1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.FESTIVE, OCCASIONS.WEDDING], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 26000 },
      { name: 'Hoop Earrings', noun: 'Hoop Earrings', icon: 'earring1', banner: 'earring1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.DAILY_WEAR, OCCASIONS.PARTY], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 21000 },
    ],
  },
  {
    name: 'Bangles',
    icon: 'bangle1',
    banner: 'bangle1',
    children: [
      { name: 'Traditional Bangles', noun: 'Bangle', icon: 'bangle1', banner: 'bangle1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.WEDDING, OCCASIONS.FESTIVE], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 110000 },
      { name: 'Kada', noun: 'Kada', icon: 'bangle1', banner: 'bangle1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.UNISEX, occasions: [OCCASIONS.FESTIVE, OCCASIONS.DAILY_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 72000 },
    ],
  },
  {
    name: 'Bracelets',
    icon: 'bracelet1',
    banner: 'bracelet1',
    children: [
      { name: 'Chain Bracelets', noun: 'Chain Bracelet', icon: 'bracelet1', banner: 'bracelet1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.UNISEX, occasions: [OCCASIONS.DAILY_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 24000 },
      { name: 'Charm Bracelets', noun: 'Charm Bracelet', icon: 'bracelet1', banner: 'bracelet1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.GIFTING, OCCASIONS.PARTY], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 20000 },
    ],
  },
  {
    name: 'Pendants',
    icon: 'necklace2',
    banner: 'giftbox1',
    children: [
      { name: 'Religious Pendants', noun: 'Pendant', icon: 'giftbox1', banner: 'giftbox1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.UNISEX, occasions: [OCCASIONS.GIFTING, OCCASIONS.DAILY_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 14000 },
      { name: 'Alphabet Pendants', noun: 'Alphabet Pendant', icon: 'necklace2', banner: 'necklace2', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.GIFTING, OCCASIONS.DAILY_WEAR], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 9500 },
    ],
  },
  {
    name: 'Gifts',
    icon: 'giftbox1',
    banner: 'giftbox1',
    children: [
      { name: 'Gift Sets', noun: 'Gift Set', icon: 'giftbox1', banner: 'giftbox1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.WOMEN, occasions: [OCCASIONS.GIFTING, OCCASIONS.WEDDING], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 32000 },
      { name: 'Gold Coins', noun: 'Gold Coin', icon: 'giftbox1', banner: 'giftbox1', metal: JEWELLERY_METALS.GOLD, gender: GENDERS.UNISEX, occasions: [OCCASIONS.GIFTING, OCCASIONS.FESTIVE], gemstoneType: GEMSTONE_TYPES.NONE, priceBase: 7000 },
    ],
  },
];

const PRODUCTS_PER_LEAF = 7;
const ADJECTIVES = ['Radiant', 'Elegant', 'Classic', 'Regal', 'Dainty', 'Timeless', 'Ornate', 'Graceful', 'Vintage', 'Modern', 'Sparkling', 'Handcrafted', 'Heritage', 'Bespoke'];
const PRICE_MULTIPLIERS = [0.85, 1, 1.15, 1.3, 0.95, 1.1, 1.25];
const DISCOUNTS = [0, 5, 8, 10, 12, 6, 0];
const STOCK_PATTERN = [14, 6, 0, 22, 9, 3, 18];
const MAKING_CHARGES = [10, 12, 14, 16];
const WASTAGE = [3, 4, 5, 6];

const PRICING_DEFAULTS = {
  discountType: 'percentage',
  discountValue: 0,
  taxIncluded: false,
  taxPercentage: 3,
  currency: 'INR',
  priceStatus: 'active',
  makingCharges: 0,
  makingChargeType: 'percentage',
  wastagePercentage: 0,
  goldRateSnapshot: 6200,
  silverRateSnapshot: 82,
  stoneCost: 0,
  diamondCost: 0,
  labourCost: 0,
};

// --- Collections (assembled from specific leaf-category products once
// they're created - see COLLECTION_PICKS below) -------------------------
const COLLECTIONS = [
  { name: 'Bridal Trousseau', banner: 'bridal1', description: 'Everything for the big day - temple necklaces, jhumkas, bangles and engagement rings, curated together.' },
  { name: 'Everyday Essentials', banner: 'necklace2', description: 'Lightweight, wear-anywhere pieces for daily wear and the office.' },
  { name: 'Festive Edit', banner: 'earring1', description: "This season's festive picks - cocktail rings, chokers and kada." },
  { name: 'Gifting Under ₹20,000', banner: 'giftbox1', description: 'Thoughtful, ready-to-gift pieces without stretching the budget.' },
  { name: "Men's Collection", banner: 'ring2', description: "Rings and kada designed for men's everyday and festive wear." },
];

// Maps a collection name to which leaf-category slugs to pull its first
// couple of products from - resolved after all products exist below.
const COLLECTION_PICKS = {
  'Bridal Trousseau': ['temple-necklaces', 'jhumka-earrings', 'traditional-bangles', 'engagement-rings'],
  'Everyday Essentials': ['chain-necklaces', 'stud-earrings', 'chain-bracelets'],
  'Festive Edit': ['cocktail-rings', 'choker-necklaces', 'kada'],
  'Gifting Under ₹20,000': ['alphabet-pendants', 'gold-coins', 'charm-bracelets'],
  "Men's Collection": ['mens-rings', 'kada'],
};

async function getSeedActor() {
  const devAdmin = await User.findOne({ phone: env.DEV_SEED_PHONE });
  if (devAdmin) return devAdmin;

  const anyAdmin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } });
  if (anyAdmin) return anyAdmin;

  throw new Error('No admin user found to attribute the seed to - run with NODE_ENV=development at least once first (seeds a dev admin), or create one manually.');
}

async function ensureCategory(actorId, { name, parent = null }, images) {
  const slug = slugify(name);
  const existing = await categoryRepository.findBySlug(slug);
  if (existing) {
    logger.info(`[seed] category "${name}" already exists, skipping`);
    return { category: existing, created: false };
  }

  const created = await categoryService.createCategory(
    { name, parent, status: 'published', isVisible: true, showInNavbar: true, showOnHomepage: !parent },
    actorId
  );

  if (images?.icon) {
    const iconMedia = await attachImage(MEDIA_ENTITY_TYPES.CATEGORY, created.id, images.icon, actorId, { altText: `${name} icon` });
    const bannerMedia = images.banner
      ? await attachImage(MEDIA_ENTITY_TYPES.CATEGORY, created.id, images.banner, actorId, { altText: `${name} banner` })
      : null;
    await categoryService.updateCategory(created.id, { iconMedia: iconMedia._id, ...(bannerMedia ? { bannerMedia: bannerMedia._id } : {}) }, actorId);
  }

  logger.info(`[seed] created category "${name}"`);
  return { category: created, created: true };
}

async function ensureProduct(actorId, categoryId, entry) {
  const slug = slugify(entry.name);
  const existing = await Product.findOne({ slug });
  if (existing) {
    logger.info(`[seed] product "${entry.name}" already exists, skipping`);
    return existing;
  }

  const product = await productService.createProduct({
    name: entry.name,
    category: categoryId,
    status: 'published',
    isVisible: true,
    isFeatured: entry.isFeatured,
    shortDescription: entry.shortDescription,
    description: entry.description,
    metal: entry.metal,
    gender: entry.gender,
    occasion: entry.occasions,
    gemstoneType: entry.gemstoneType,
    tags: entry.tags,
  });

  await pricingService.updatePricing(
    product.id,
    { ...PRICING_DEFAULTS, sellingPrice: entry.pricing.mrp, ...entry.pricing, reason: 'Full catalog seed' },
    actorId
  );

  if (entry.stock > 0) {
    const inventory = await inventoryRepository.findPaginated({ page: 1, limit: 1, product: product.id, sortBy: 'createdAt', sortOrder: 'desc' });
    const inventoryRecord = inventory.items[0];
    if (inventoryRecord) {
      await inventoryLedgerService.recordMovement({
        inventoryId: inventoryRecord._id,
        movementType: MOVEMENT_TYPES.OPENING_STOCK,
        quantityChanged: entry.stock,
        reason: 'Full catalog seed - opening stock',
        performedBy: actorId,
      });
    }
  }

  await attachImage(MEDIA_ENTITY_TYPES.PRODUCT, product.id, entry.imageKey, actorId, { altText: entry.name });

  logger.info(`[seed] created product "${entry.name}" (stock: ${entry.stock})`);
  return Product.findOne({ slug });
}

function buildProductEntries(leaf, leafIndex) {
  const metalLabel = leaf.metal.charAt(0).toUpperCase() + leaf.metal.slice(1);
  const entries = [];
  for (let i = 0; i < PRODUCTS_PER_LEAF; i += 1) {
    const adjective = ADJECTIVES[(leafIndex * PRODUCTS_PER_LEAF + i) % ADJECTIVES.length];
    const name = `${adjective} ${metalLabel} ${leaf.noun}`;
    const mrp = Math.round((leaf.priceBase * PRICE_MULTIPLIERS[i % PRICE_MULTIPLIERS.length]) / 100) * 100;
    const costPrice = Math.round((mrp * 0.8) / 100) * 100;
    entries.push({
      name,
      shortDescription: `A ${adjective.toLowerCase()} ${leaf.noun.toLowerCase()} in ${leaf.metal}, crafted for ${leaf.occasions[0].replace('-', ' ')}.`,
      description: `Hand-finished in ${leaf.metal}, this ${leaf.noun.toLowerCase()} suits ${leaf.occasions.join(' and ').replace(/-/g, ' ')} occasions alike. Certified hallmark purity, ready to ship.`,
      isFeatured: i === 0,
      metal: leaf.metal,
      gender: leaf.gender,
      occasions: leaf.occasions,
      gemstoneType: leaf.gemstoneType,
      tags: [leaf.metal, leaf.noun.toLowerCase()],
      imageKey: leaf.icon,
      stock: STOCK_PATTERN[i % STOCK_PATTERN.length],
      pricing: {
        costPrice,
        mrp,
        discountType: 'percentage',
        discountValue: DISCOUNTS[i % DISCOUNTS.length],
        taxPercentage: 3,
        makingCharges: MAKING_CHARGES[i % MAKING_CHARGES.length],
        makingChargeType: 'percentage',
        wastagePercentage: WASTAGE[i % WASTAGE.length],
        goldRateSnapshot: 6200,
      },
    });
  }
  return entries;
}

async function ensureCollection(actorId, def) {
  const slug = slugify(def.name);
  const existing = await Collection.findOne({ slug });
  if (existing) {
    logger.info(`[seed] collection "${def.name}" already exists, skipping`);
    return { collection: existing, created: false };
  }

  const created = await collectionService.createCollection({
    name: def.name,
    description: def.description,
    shortDescription: def.description,
    status: 'published',
    isVisible: true,
    isFeatured: true,
    type: COLLECTION_TYPES.MANUAL,
    assignmentType: ASSIGNMENT_TYPES.MANUAL,
  });

  const bannerMedia = await attachImage(MEDIA_ENTITY_TYPES.COLLECTION, created.id, def.banner, actorId, { altText: def.name });
  const collectionDoc = await Collection.findByIdAndUpdate(created.id, { bannerMedia: bannerMedia._id, thumbnailMedia: bannerMedia._id }, { new: true });

  logger.info(`[seed] created collection "${def.name}"`);
  return { collection: collectionDoc, created: true };
}

async function ensureHomepageBanners(actorId) {
  const BANNERS = [
    { title: 'Bridal Trousseau - Shop Now', imageKey: 'bridal1', position: BANNER_POSITIONS.HOMEPAGE_HERO, subtitle: 'Certified hallmark gold for your big day', ctaLabel: 'Shop Bridal', linkUrl: '/collections/bridal-trousseau' },
    { title: "New Season - Everyday Gold", imageKey: 'necklace2', position: BANNER_POSITIONS.HOMEPAGE_HERO, subtitle: 'Lightweight pieces for daily wear', ctaLabel: 'Shop Now', linkUrl: '/collections/everyday-essentials' },
    { title: 'Festive Edit', imageKey: 'earring1', position: BANNER_POSITIONS.HOMEPAGE_SECONDARY, subtitle: 'Cocktail rings, chokers and kada', ctaLabel: 'Explore', linkUrl: '/collections/festive-edit' },
    { title: 'Gifting Under ₹20,000', imageKey: 'giftbox1', position: BANNER_POSITIONS.HOMEPAGE_SECONDARY, subtitle: 'Thoughtful pieces, ready to gift', ctaLabel: 'Shop Gifts', linkUrl: '/collections/gifting-under-20000' },
  ];

  for (const def of BANNERS) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Banner.findOne({ title: def.title });
    if (existing) {
      logger.info(`[seed] banner "${def.title}" already exists, skipping`);
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    const banner = await Banner.create({
      title: def.title,
      subtitle: def.subtitle,
      ctaLabel: def.ctaLabel,
      linkUrl: def.linkUrl,
      position: def.position,
      isActive: false,
      order: 0,
    });
    // eslint-disable-next-line no-await-in-loop
    const media = await attachImage(MEDIA_ENTITY_TYPES.BANNER, banner._id, def.imageKey, actorId, { altText: def.title });
    banner.primaryMedia = media._id;
    banner.isActive = true;
    // eslint-disable-next-line no-await-in-loop
    await banner.save();
    logger.info(`[seed] created homepage banner "${def.title}"`);
  }
}

async function run() {
  await connectDB();
  await warehouseService.ensureDefaultWarehouse();

  const actor = await getSeedActor();
  logger.info(`[seed] attributing seed data to ${actor.name} (${actor.email})`);

  const productsByLeafSlug = new Map();
  let productCount = 0;

  for (let parentIndex = 0; parentIndex < CATEGORY_TREE.length; parentIndex += 1) {
    const parentDef = CATEGORY_TREE[parentIndex];
    // eslint-disable-next-line no-await-in-loop
    const { category: parentCategory } = await ensureCategory(actor._id, { name: parentDef.name }, { icon: parentDef.icon, banner: parentDef.banner });

    for (let leafIndex = 0; leafIndex < parentDef.children.length; leafIndex += 1) {
      const leafDef = parentDef.children[leafIndex];
      // eslint-disable-next-line no-await-in-loop
      const { category: leafCategory } = await ensureCategory(
        actor._id,
        { name: leafDef.name, parent: parentCategory.id },
        { icon: leafDef.icon, banner: leafDef.banner }
      );

      const entries = buildProductEntries(leafDef, parentIndex * 3 + leafIndex);
      const leafSlug = slugify(leafDef.name);
      const leafProducts = [];
      for (const entry of entries) {
        // eslint-disable-next-line no-await-in-loop
        const product = await ensureProduct(actor._id, leafCategory.id, entry);
        leafProducts.push(product);
        productCount += 1;
      }
      productsByLeafSlug.set(leafSlug, leafProducts);
    }
  }

  logger.info(`[seed] catalog now has ${productCount} products processed across ${CATEGORY_TREE.length} top-level categories`);

  for (const def of COLLECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    const { collection, created } = await ensureCollection(actor._id, def);
    if (!created) continue; // eslint-disable-line no-continue

    const leafSlugs = COLLECTION_PICKS[def.name] ?? [];
    for (const leafSlug of leafSlugs) {
      // The first (featured) product from that leaf category - real
      // products this run just created, not a guessed/fuzzy match.
      const [firstProduct] = productsByLeafSlug.get(leafSlug) ?? [];
      if (firstProduct) {
        // eslint-disable-next-line no-await-in-loop
        await Product.findByIdAndUpdate(firstProduct._id, { collectionId: collection._id });
      }
    }
    logger.info(`[seed] assigned products to collection "${def.name}"`);
  }

  await ensureHomepageBanners(actor._id);

  logger.info('[seed] Full catalog seed complete.');
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error({ err: err.message, stack: err.stack }, '[seed] Full catalog seed failed');
  await disconnectDB().catch(() => {});
  process.exit(1);
});
