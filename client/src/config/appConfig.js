export const APP_NAME = 'Amardeep Swarna Kala Kendra';
// The name most local customers actually search/ask for - used alongside
// APP_NAME in <title>/meta description/JSON-LD `alternateName` so search
// engines connect queries like "Amardeep Jewellers Akbarpur" to this site,
// not just the formal registered name.
export const APP_ALTERNATE_NAME = 'Amardeep Jewellers';
export const APP_SHORT_NAME = 'ADSP';
export const APP_TAGLINE = 'Timeless Beauty, Made for You';

export const SUPPORT_PHONE = '+91 8808485840';
export const SUPPORT_EMAIL = 'contact@amardeepshitalaprashad.com';

// Real store locality - used as the JSON-LD/meta-tag fallback whenever
// Settings -> address hasn't been filled in yet (Admin panel), and as the
// location keywords search engines should associate with this business.
export const STORE_LOCALITY = 'Akbarpur';
export const STORE_DISTRICT = 'Ambedkar Nagar';
export const STORE_STATE = 'Uttar Pradesh';
export const STORE_COUNTRY = 'India';
export const STORE_ADDRESS_FALLBACK = `${STORE_LOCALITY}, ${STORE_DISTRICT}, ${STORE_STATE}`;

// The real, live production domain (SITE_URL in backend/.env matches this) -
// used to build absolute canonical URLs and JSON-LD `url`/`logo` fields.
export const SITE_URL = 'https://amardeepshitalaprashad.com';

// Below this real (backend-reported) stockQuantity, ProductCard shows an
// "Only N left!" urgency badge instead of nothing - a presentation
// decision, so it lives here, not on the API response.
export const LOW_STOCK_THRESHOLD = 5;
