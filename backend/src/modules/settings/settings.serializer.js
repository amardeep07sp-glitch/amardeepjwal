import { serializeMediaRef } from '../media/media.serializer.js';

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
