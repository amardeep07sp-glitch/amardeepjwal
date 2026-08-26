// Every named CIP report, in the exact same registry shape Phase 11's
// Reports Center already established (see reports/reportRegistry.js) -
// reusing that shape means CIP's Reports Center reuses DomainReportsTab/
// ReportResultView/ReportExportButtons/useReportQuery verbatim, with zero
// new generic UI code. Exports are deliberately omitted here - unlike
// Phase 11's spec, Phase 12's Reports section doesn't ask for CSV/Excel/
// PDF, so no report here sets `exportable`.

export const OVERVIEW_REPORTS = [
  { key: 'visitor-report', label: 'Visitor Report', endpoint: '/cip/reports/visitors', shape: 'object', dateRange: true },
  { key: 'engagement-report', label: 'Engagement (Bounce Rate & Time on Site)', endpoint: '/cip/reports/engagement', shape: 'object', dateRange: true },
  { key: 'device-report', label: 'Device Report', endpoint: '/cip/reports/devices', shape: 'object', dateRange: true },
  { key: 'location-report', label: 'Location Report', endpoint: '/cip/reports/locations', shape: 'object', dateRange: true },
  {
    key: 'session-report',
    label: 'Session Report',
    endpoint: '/cip/sessions',
    shape: 'paginated',
    dateRange: true,
    columns: [
      { key: 'sessionId', header: 'Session' },
      { key: 'visitorType', header: 'Type' },
      { key: 'isReturning', header: 'Returning' },
      { key: 'isBounce', header: 'Bounce' },
      { key: 'durationSeconds', header: 'Duration (s)' },
      { key: 'startTime', header: 'Started' },
    ],
  },
];

export const TRAFFIC_REPORTS = [
  { key: 'traffic-sources', label: 'Traffic Sources', endpoint: '/cip/reports/traffic/sources', shape: 'array', dateRange: true, columns: [{ key: '_id', header: 'Source' }, { key: 'count', header: 'Visits' }] },
  {
    key: 'utm-campaigns',
    label: 'UTM Campaigns',
    endpoint: '/cip/reports/traffic/utm-campaigns',
    shape: 'array',
    dateRange: true,
    columns: [{ key: 'campaign', header: 'Campaign' }, { key: 'source', header: 'Source' }, { key: 'medium', header: 'Medium' }, { key: 'visits', header: 'Visits' }, { key: 'sessionCount', header: 'Sessions' }],
  },
  { key: 'landing-pages', label: 'Top Landing Pages', endpoint: '/cip/reports/traffic/landing-pages', shape: 'array', dateRange: true, columns: [{ key: '_id', header: 'Page' }, { key: 'visits', header: 'Visits' }] },
  {
    key: 'campaign-performance',
    label: 'Campaign Report (ROAS)',
    endpoint: '/cip/reports/marketing/campaigns',
    shape: 'array',
    dateRange: true,
    columns: [{ key: 'campaign', header: 'Campaign' }, { key: 'orders', header: 'Orders' }, { key: 'revenue', header: 'Revenue' }, { key: 'spend', header: 'Spend' }, { key: 'roas', header: 'ROAS' }],
  },
];

export const SEARCH_REPORTS = [
  { key: 'top-searches', label: 'Top Searches', endpoint: '/cip/reports/search/top', shape: 'array', dateRange: true, columns: [{ key: '_id', header: 'Query' }, { key: 'count', header: 'Searches' }, { key: 'avgResultCount', header: 'Avg Results' }] },
  { key: 'no-result-searches', label: 'No-Result Searches', endpoint: '/cip/reports/search/no-results', shape: 'array', dateRange: true, columns: [{ key: '_id', header: 'Query' }, { key: 'count', header: 'Searches' }] },
  { key: 'trending-searches', label: 'Trending Searches', endpoint: '/cip/reports/search/trending', shape: 'array', columns: [{ key: '_id', header: 'Query' }, { key: 'count', header: 'Searches' }] },
  { key: 'search-conversion', label: 'Search Conversion', endpoint: '/cip/reports/search/conversion', shape: 'object', dateRange: true },
];

export const PRODUCT_REPORTS = [
  {
    key: 'product-performance',
    label: 'Product Performance',
    endpoint: '/cip/reports/products/performance',
    shape: 'paginated',
    dateRange: true,
    columns: [
      { key: 'name', header: 'Product' },
      { key: 'views', header: 'Views' },
      { key: 'uniqueViews', header: 'Unique Views' },
      { key: 'wishlistAdds', header: 'Wishlist' },
      { key: 'cartAdds', header: 'Cart' },
      { key: 'unitsSold', header: 'Sold' },
      { key: 'conversionRate', header: 'Conv %' },
    ],
  },
  {
    key: 'category-performance',
    label: 'Category Performance',
    endpoint: '/cip/reports/categories/performance',
    shape: 'array',
    dateRange: true,
    columns: [{ key: 'name', header: 'Category' }, { key: 'views', header: 'Views' }, { key: 'clicks', header: 'Clicks' }, { key: 'conversion', header: 'Conv %' }, { key: 'exitRate', header: 'Exit %' }],
  },
  { key: 'most-wishlisted', label: 'Most Wishlisted', endpoint: '/cip/reports/wishlist/top', shape: 'array', dateRange: true, columns: [{ key: 'name', header: 'Product' }, { key: 'wishlistCount', header: 'Wishlisted' }] },
  { key: 'wishlist-conversion', label: 'Wishlist Conversion', endpoint: '/cip/reports/wishlist/conversion', shape: 'object', dateRange: true },
];

export const FUNNEL_REPORTS = [
  { key: 'funnel', label: 'Conversion Funnel', endpoint: '/cip/reports/funnel', shape: 'array', dateRange: true, columns: [{ key: 'label', header: 'Step' }, { key: 'sessions', header: 'Sessions' }, { key: 'dropOffRate', header: 'Drop-off %' }] },
  { key: 'common-paths', label: 'Common Journey Paths', endpoint: '/cip/reports/journey/common-paths', shape: 'array', dateRange: true, columns: [{ key: 'path', header: 'Path' }, { key: 'count', header: 'Sessions' }] },
];

export const CART_REPORTS = [
  { key: 'cart-summary', label: 'Cart Summary', endpoint: '/cip/reports/cart/summary', shape: 'object', dateRange: true },
  { key: 'cart-recovery', label: 'Cart Recovery', endpoint: '/cip/reports/cart/recovery', shape: 'object', dateRange: true },
];

export const NOTIFICATION_REPORTS = [
  { key: 'notification-report', label: 'Notification Report', endpoint: '/cip/reports/notifications', shape: 'object', dateRange: true },
];

export const CIP_REPORT_DOMAINS = [
  { key: 'overview', label: 'Overview', reports: OVERVIEW_REPORTS },
  { key: 'traffic', label: 'Traffic & Marketing', reports: TRAFFIC_REPORTS },
  { key: 'search', label: 'Search', reports: SEARCH_REPORTS },
  { key: 'products', label: 'Products & Wishlist', reports: PRODUCT_REPORTS },
  { key: 'funnel', label: 'Funnel & Journey', reports: FUNNEL_REPORTS },
  { key: 'cart', label: 'Cart', reports: CART_REPORTS },
  { key: 'notifications', label: 'Notifications', reports: NOTIFICATION_REPORTS },
];
