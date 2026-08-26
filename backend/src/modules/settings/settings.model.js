import mongoose from 'mongoose';
import { HEADING_FONTS, HEADING_FONT_VALUES, BODY_FONTS, BODY_FONT_VALUES } from '../../constants/typography.js';

// Site-wide font picker (Settings -> Typography) - see constants/
// typography.js's header comment for why this is a closed enum, not
// free text. `headingFont` drives the storefront's display/brand
// typography (hero, section titles, product names - anything using the
// `font-display` Tailwind utility); `bodyFont` drives everything else
// (body copy, buttons, prices, form inputs). The header nav's own font
// (Fraunces) is a separate, fixed brand-identity detail, not exposed
// here - deliberately out of scope for this pass.
const typographySchema = new mongoose.Schema(
  {
    headingFont: { type: String, enum: HEADING_FONT_VALUES, default: HEADING_FONTS.PLAYFAIR_DISPLAY },
    bodyFont: { type: String, enum: BODY_FONT_VALUES, default: BODY_FONTS.INTER },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    twitter: { type: String, trim: true, default: '' },
    youtube: { type: String, trim: true, default: '' },
    pinterest: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const seoDefaultsSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    ogImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
  },
  { _id: false }
);

// The seller's own registered address - structured (not the free-text
// `address` field above, which is footer/contact-page display copy) since
// a real tax invoice needs city/state/postalCode as distinct fields (state
// specifically drives the CGST+SGST vs IGST split - see invoice.service.js).
const registeredAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: '' },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false }
);

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, uppercase: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, required: true, trim: true, default: 'Amardeep Swarna Kala Kendra' },
    siteTagline: { type: String, trim: true, default: '' },
    logoMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    faviconMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    contactEmail: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    whatsappNumber: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    currency: { type: String, trim: true, default: 'INR' },
    footerCopyrightText: { type: String, trim: true, default: '' },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    seoDefaults: { type: seoDefaultsSchema, default: () => ({}) },
    typography: { type: typographySchema, default: () => ({}) },
    // --- Tax invoice ("Sold By") details - blank by default; the invoice
    // PDF omits any block whose fields are still empty rather than
    // printing placeholder text (see invoice.pdf.js). ---
    legalBusinessName: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    panNumber: { type: String, trim: true, uppercase: true, default: '' },
    registeredAddress: { type: registeredAddressSchema, default: () => ({}) },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    invoiceTerms: {
      type: String,
      trim: true,
      default:
        'Goods once sold will only be exchanged or returned as per the store\'s return policy. All disputes are subject to local jurisdiction only.',
    },
  },
  { timestamps: true }
);

export const Settings = mongoose.model('Settings', settingsSchema);
