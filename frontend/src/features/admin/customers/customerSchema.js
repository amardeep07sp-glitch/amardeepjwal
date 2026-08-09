export const CUSTOMER_STATUS_LABELS = {
  lead: 'Lead',
  prospect: 'Prospect',
  active: 'Active',
  vip: 'VIP',
  inactive: 'Inactive',
  blocked: 'Blocked',
  archived: 'Archived',
};

export const CUSTOMER_STATUS_BADGE_VARIANTS = {
  lead: 'secondary',
  prospect: 'info',
  active: 'success',
  vip: 'warning',
  inactive: 'secondary',
  blocked: 'destructive',
  archived: 'secondary',
};

export const CUSTOMER_TYPE_LABELS = {
  retail: 'Retail',
  wholesale: 'Wholesale',
  b2b: 'B2B',
  b2c: 'B2C',
};

export const LEAD_SOURCE_LABELS = {
  walk_in: 'Walk-in',
  referral: 'Referral',
  website: 'Website',
  social_media: 'Social Media',
  advertisement: 'Advertisement',
  other: 'Other',
};

export const ADDRESS_TYPE_LABELS = {
  billing: 'Billing',
  shipping: 'Shipping',
  office: 'Office',
  warehouse: 'Warehouse',
};

export const LOYALTY_TIER_LABELS = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
};

export const LOYALTY_TIER_BADGE_VARIANTS = {
  silver: 'secondary',
  gold: 'warning',
  platinum: 'info',
  diamond: 'success',
};

export const WALLET_TXN_TYPE_LABELS = {
  credit: 'Credit',
  debit: 'Debit',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

export const LOYALTY_TXN_TYPE_LABELS = {
  earn: 'Earned',
  redeem: 'Redeemed',
  expire: 'Expired',
  adjust: 'Adjusted',
};

export const REFERRAL_STATUS_LABELS = {
  pending: 'Pending',
  completed: 'Completed',
  rewarded: 'Rewarded',
};

export const REFERRAL_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  completed: 'info',
  rewarded: 'success',
};

export const NOTIFICATION_STATUS_BADGE_VARIANTS = {
  sent: 'info',
  delivered: 'success',
  read: 'success',
  failed: 'destructive',
};

export const CUSTOMER_TIMELINE_LABELS = {
  registered: 'Registered',
  order_placed: 'Order Placed',
  payment_received: 'Payment Received',
  refund_issued: 'Refund Issued',
  return_processed: 'Return Processed',
  wallet_transaction: 'Wallet Transaction',
  points_earned: 'Points Earned',
  points_redeemed: 'Points Redeemed',
  note_added: 'Note Added',
  status_changed: 'Status Changed',
};
