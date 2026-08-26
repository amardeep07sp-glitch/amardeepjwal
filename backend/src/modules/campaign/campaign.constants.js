// Marketing metadata only - a campaign's TYPE never drives discount logic
// by itself (that's what Coupon's own rules do). This just labels intent
// for the admin list/filter and analytics grouping.
export const CAMPAIGN_TYPES = Object.freeze({
  DIWALI: 'diwali',
  AKSHAYA_TRITIYA: 'akshaya_tritiya',
  VALENTINE: 'valentine',
  WEDDING: 'wedding',
  BRIDAL: 'bridal',
  RAKSHA_BANDHAN: 'raksha_bandhan',
  FESTIVE: 'festive',
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  NEW_COLLECTION: 'new_collection',
  CLEARANCE: 'clearance',
  FIRST_PURCHASE: 'first_purchase',
  REACTIVATION: 'reactivation',
  CUSTOM: 'custom',
});

export const CAMPAIGN_STATUSES = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXHAUSTED: 'exhausted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
});

export const CAMPAIGN_STATUS_VALUES = Object.values(CAMPAIGN_STATUSES);
export const CAMPAIGN_TYPE_VALUES = Object.values(CAMPAIGN_TYPES);
