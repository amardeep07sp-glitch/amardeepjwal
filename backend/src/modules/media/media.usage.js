import { Product } from '../product/product.model.js';
import { Variant } from '../product/variant/variant.model.js';
import { Category } from '../category/category.model.js';
import { Brand } from '../brand/brand.model.js';
import { Collection } from '../collection/collection.model.js';
import { Banner } from '../banner/banner.model.js';
import { HomepageSection } from '../homepageSection/homepageSection.model.js';
import { Page } from '../page/page.model.js';
import { Settings } from '../settings/settings.model.js';
import { MEDIA_ENTITY_TYPES } from './media.constants.js';

// "Home" usage: the Media document's own entityType/entityId scope, for
// entities with a genuine OPEN gallery (any number of images/videos can
// belong to one entityId - Product/Variant, via MediaGrid). Deliberately
// does NOT include Category/Brand/Collection/Banner/Homepage/CMS Page/
// Settings - those only ever have a small, fixed set of named single-picker
// fields (logoMedia, bannerMedia, ...), which is exactly what
// REFERENCE_LOOKUPS below already checks. Uploading via MediaPicker sets a
// media doc's entityType/entityId to its owning module AND that module's
// field points back at the same doc - counting both would double-count the
// same real-world usage, and would also make "just uploaded, never actually
// picked" images look used just because the owner still exists.
const HOME_LOOKUPS = {
  [MEDIA_ENTITY_TYPES.PRODUCT]: { module: 'Product', Model: Product, nameField: 'name' },
  [MEDIA_ENTITY_TYPES.VARIANT]: { module: 'Variant', Model: Variant, nameField: 'sku' },
};

// "Reference" usage: single-picker *Media fields on OTHER documents that
// point at a Media _id (e.g. Brand.logoMedia, Category.bannerMedia). Extending
// this for a future module's picker field is one line here - nothing else to
// touch (repository/service stay generic).
const REFERENCE_LOOKUPS = [
  { module: 'Settings', Model: Settings, field: 'logoMedia', nameField: 'siteName' },
  { module: 'Settings', Model: Settings, field: 'faviconMedia', nameField: 'siteName' },
  { module: 'Settings', Model: Settings, field: 'seoDefaults.ogImageMedia', nameField: 'siteName' },
  { module: 'Banner', Model: Banner, field: 'primaryMedia', nameField: 'title' },
  { module: 'Homepage', Model: HomepageSection, field: 'primaryMedia', nameField: 'internalTitle' },
  { module: 'CMS Page', Model: Page, field: 'heroMedia', nameField: 'title' },
  { module: 'CMS Page', Model: Page, field: 'ogImageMedia', nameField: 'title' },
  { module: 'Category', Model: Category, field: 'iconMedia', nameField: 'name' },
  { module: 'Category', Model: Category, field: 'bannerMedia', nameField: 'name' },
  { module: 'Category', Model: Category, field: 'thumbnailMedia', nameField: 'name' },
  { module: 'Category', Model: Category, field: 'seo.ogImageMedia', nameField: 'name' },
  { module: 'Brand', Model: Brand, field: 'logoMedia', nameField: 'name' },
  { module: 'Brand', Model: Brand, field: 'bannerMedia', nameField: 'name' },
  { module: 'Brand', Model: Brand, field: 'seo.ogImageMedia', nameField: 'name' },
  { module: 'Collection', Model: Collection, field: 'bannerMedia', nameField: 'name' },
  { module: 'Collection', Model: Collection, field: 'thumbnailMedia', nameField: 'name' },
  { module: 'Collection', Model: Collection, field: 'seo.ogImageMedia', nameField: 'name' },
  { module: 'Product', Model: Product, field: 'seo.ogImageMedia', nameField: 'name' },
];

// Full usage report for a single media document - powers GET /media/:id/usage
// and the delete-protection check. Deduped by (module, entityId): even with
// HOME_LOOKUPS narrowed to open-gallery entities only, a Product's own
// seo.ogImageMedia could in principle point back at one of its own gallery
// images, which would otherwise surface as two identical-looking entries.
export async function findUsageForMedia(media) {
  const results = [];
  const seen = new Set();
  const add = (entry) => {
    const key = `${entry.module}:${entry.entityId}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(entry);
  };

  const home = HOME_LOOKUPS[media.entityType];
  if (home) {
    const doc = await home.Model.findById(media.entityId).select(`${home.nameField} createdAt`);
    if (doc) {
      add({
        module: home.module,
        entityId: doc._id.toString(),
        entityName: doc[home.nameField] ?? '',
        createdAt: doc.createdAt,
      });
    }
  }

  for (const ref of REFERENCE_LOOKUPS) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await ref.Model.find({ [ref.field]: media._id }).select(`${ref.nameField} createdAt`);
    for (const doc of docs) {
      add({
        module: ref.module,
        entityId: doc._id.toString(),
        entityName: doc[ref.nameField] ?? '',
        createdAt: doc.createdAt,
      });
    }
  }

  return results;
}

export function summarizeUsage(usageEntries) {
  const counts = new Map();
  for (const entry of usageEntries) {
    counts.set(entry.module, (counts.get(entry.module) ?? 0) + 1);
  }
  return Array.from(counts, ([module, count]) => ({ module, count }));
}

export function buildUsageConflictMessage(summary) {
  const parts = summary.map(({ module, count }) => `${module} (${count})`).join(', ');
  return `Cannot delete media. Currently used by ${parts}.`;
}

// Which entity types have a real "home" ownership link worth checking for
// orphaning (Product/Variant open galleries) - everything else is governed
// by REFERENCE_LOOKUPS instead, so it's neither home-tracked nor orphanable
// in this sense.
export function isHomeTrackedEntityType(entityType) {
  return Boolean(HOME_LOOKUPS[entityType]);
}

// Batch version of the "home" half of usage resolution - which of these
// media docs' own entityType/entityId still resolves to a real document.
// Shared by findUsedMediaIdSet (used/unused filter) and the orphan check in
// the health report, which need this same fact for two different purposes.
export async function findMediaIdsWithExistingHome(mediaDocs) {
  const withHome = new Set();

  const byEntityType = new Map();
  for (const media of mediaDocs) {
    if (!byEntityType.has(media.entityType)) byEntityType.set(media.entityType, []);
    byEntityType.get(media.entityType).push(media);
  }

  for (const [entityType, mediaList] of byEntityType) {
    const home = HOME_LOOKUPS[entityType];
    if (!home) continue;
    const entityIds = mediaList.map((m) => m.entityId);
    // eslint-disable-next-line no-await-in-loop
    const existing = await home.Model.find({ _id: { $in: entityIds } }).select('_id');
    const existingIds = new Set(existing.map((doc) => doc._id.toString()));
    for (const media of mediaList) {
      if (existingIds.has(media.entityId?.toString())) withHome.add(media._id.toString());
    }
  }

  return withHome;
}

// Batch check for the media library's Used/Unused filter - one query per
// registry entry across the WHOLE candidate id set, instead of one usage
// lookup per media item. "Used" = its home entity still exists OR something
// else references it via a *Media picker field.
export async function findUsedMediaIdSet(mediaDocs) {
  const used = await findMediaIdsWithExistingHome(mediaDocs);

  const mediaIds = mediaDocs.map((m) => m._id);
  for (const ref of REFERENCE_LOOKUPS) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await ref.Model.find({ [ref.field]: { $in: mediaIds } }).select(ref.field);
    for (const doc of docs) {
      const value = ref.field.split('.').reduce((obj, key) => obj?.[key], doc);
      if (value) used.add(value.toString());
    }
  }

  return used;
}
