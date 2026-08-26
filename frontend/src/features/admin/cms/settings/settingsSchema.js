import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

// Must match backend/src/constants/typography.js exactly - a curated,
// pre-bundled (self-hosted, no Google Fonts CDN) allowlist, not free
// text. See client/src/config/typography.js for the CSS side of this
// same contract.
export const HEADING_FONT_OPTIONS = [
  { value: 'playfair-display', label: 'Playfair Display - Elegant Serif' },
  { value: 'cormorant-garamond', label: 'Cormorant Garamond - Luxury Serif' },
];

export const BODY_FONT_OPTIONS = [
  { value: 'inter', label: 'Inter - Modern Sans' },
  { value: 'poppins', label: 'Poppins - Geometric Sans' },
];

export const settingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteTagline: z.string().optional(),
  logoMedia: mediaRefSchema,
  faviconMedia: mediaRefSchema,
  contactEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  contactPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  footerCopyrightText: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    pinterest: z.string().optional(),
  }),
  seoDefaults: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImageMedia: mediaRefSchema,
  }),
  typography: z.object({
    headingFont: z.enum(HEADING_FONT_OPTIONS.map((o) => o.value)),
    bodyFont: z.enum(BODY_FONT_OPTIONS.map((o) => o.value)),
  }),
  legalBusinessName: z.string().optional(),
  gstin: z.string().optional(),
  panNumber: z.string().optional(),
  registeredAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  bankDetails: z.object({
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
    branch: z.string().optional(),
  }),
  invoiceTerms: z.string().optional(),
});

export const settingsFormDefaults = {
  siteName: '',
  siteTagline: '',
  logoMedia: null,
  faviconMedia: null,
  contactEmail: '',
  contactPhone: '',
  whatsappNumber: '',
  address: '',
  currency: 'INR',
  footerCopyrightText: '',
  socialLinks: { facebook: '', instagram: '', twitter: '', youtube: '', pinterest: '' },
  seoDefaults: { metaTitle: '', metaDescription: '', ogImageMedia: null },
  typography: { headingFont: 'playfair-display', bodyFont: 'inter' },
  legalBusinessName: '',
  gstin: '',
  panNumber: '',
  registeredAddress: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' },
  bankDetails: { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branch: '' },
  invoiceTerms: '',
};
