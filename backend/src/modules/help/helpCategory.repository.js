import { HelpCategory } from './helpCategory.model.js';
import { HELP_CATEGORY_VALUES } from './help.constants.js';

// One-time human-readable defaults for the fixed category codes - only
// ever used to seed a row the first time (ensureSeeded below); once a row
// exists, the admin-edited label/description/icon in the DB is what's
// actually served, this map is never read again after that.
const DEFAULT_LABELS = {
  orders: 'Orders',
  payments: 'Payments',
  shipping: 'Shipping',
  returns_refunds: 'Returns & Refunds',
  coupons_offers: 'Coupons & Offers',
  jewellery_pricing: 'Jewellery & Pricing',
  account: 'Account',
  invoice: 'Invoice',
  wishlist: 'Wishlist',
  reviews: 'Reviews',
  website: 'Website',
  security: 'Security',
};

export const helpCategoryRepository = {
  // Idempotent, same "ensure the fixed set exists, never touch what's
  // already there" discipline as warehouseService.ensureDefaultWarehouse -
  // safe to call on every boot.
  async ensureSeeded() {
    const existing = await HelpCategory.find({}, 'code');
    const existingCodes = new Set(existing.map((c) => c.code));
    const missing = HELP_CATEGORY_VALUES.filter((code) => !existingCodes.has(code));
    if (missing.length === 0) return;

    await HelpCategory.insertMany(
      missing.map((code) => ({ code, label: DEFAULT_LABELS[code] ?? code, displayOrder: HELP_CATEGORY_VALUES.indexOf(code) }))
    );
  },

  findAllOrdered() {
    return HelpCategory.find().sort({ displayOrder: 1, code: 1 });
  },

  findByCode(code) {
    return HelpCategory.findOne({ code });
  },

  updateByCode(code, data, userId) {
    return HelpCategory.findOneAndUpdate({ code }, { ...data, updatedBy: userId }, { new: true });
  },
};
