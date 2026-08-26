import { serializeMediaRef } from '../media/media.serializer.js';
import { HEADING_FONTS, BODY_FONTS } from '../../constants/typography.js';

const serializeTypography = (typography) => ({
  headingFont: typography?.headingFont ?? HEADING_FONTS.PLAYFAIR_DISPLAY,
  bodyFont: typography?.bodyFont ?? BODY_FONTS.INTER,
});

export const serializeSettings = (settings) => {
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : settings;

  return {
    id: plain._id,
    siteName: plain.siteName,
    siteTagline: plain.siteTagline,
    logoMedia: serializeMediaRef(plain.logoMedia),
    faviconMedia: serializeMediaRef(plain.faviconMedia),
    contactEmail: plain.contactEmail,
    contactPhone: plain.contactPhone,
    whatsappNumber: plain.whatsappNumber,
    address: plain.address,
    currency: plain.currency,
    footerCopyrightText: plain.footerCopyrightText,
    socialLinks: plain.socialLinks,
    seoDefaults: {
      metaTitle: plain.seoDefaults?.metaTitle ?? '',
      metaDescription: plain.seoDefaults?.metaDescription ?? '',
      ogImageMedia: serializeMediaRef(plain.seoDefaults?.ogImageMedia),
    },
    typography: serializeTypography(plain.typography),
    legalBusinessName: plain.legalBusinessName ?? '',
    gstin: plain.gstin ?? '',
    panNumber: plain.panNumber ?? '',
    registeredAddress: {
      line1: plain.registeredAddress?.line1 ?? '',
      line2: plain.registeredAddress?.line2 ?? '',
      city: plain.registeredAddress?.city ?? '',
      state: plain.registeredAddress?.state ?? '',
      postalCode: plain.registeredAddress?.postalCode ?? '',
      country: plain.registeredAddress?.country ?? '',
    },
    bankDetails: {
      accountHolderName: plain.bankDetails?.accountHolderName ?? '',
      accountNumber: plain.bankDetails?.accountNumber ?? '',
      ifscCode: plain.bankDetails?.ifscCode ?? '',
      bankName: plain.bankDetails?.bankName ?? '',
      branch: plain.bankDetails?.branch ?? '',
    },
    invoiceTerms: plain.invoiceTerms ?? '',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

// Storefront-facing subset - no GSTIN/PAN/bank details/invoice terms (those
// are back-office facts a guest visitor has no reason to see), just what a
// real Contact Us page/footer needs. `typography` IS included here (unlike
// those financial fields) - it's the one admin-only-editable field the
// storefront actually needs to read, to apply the chosen fonts at runtime
// (see client/src/components/global/ApplyTypography.jsx).
export const serializePublicSettings = (settings) => {
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : settings;

  return {
    siteName: plain.siteName,
    siteTagline: plain.siteTagline,
    contactEmail: plain.contactEmail,
    contactPhone: plain.contactPhone,
    whatsappNumber: plain.whatsappNumber,
    address: plain.address,
    socialLinks: plain.socialLinks,
    footerCopyrightText: plain.footerCopyrightText,
    typography: serializeTypography(plain.typography),
  };
};
