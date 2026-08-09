import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    siteName: z.string().min(1, 'Site name is required').optional(),
    siteTagline: z.string().optional(),
    logoMedia: z.string().optional().nullable(),
    faviconMedia: z.string().optional().nullable(),
    contactEmail: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
    contactPhone: z.string().optional(),
    whatsappNumber: z.string().optional(),
    address: z.string().optional(),
    currency: z.string().optional(),
    footerCopyrightText: z.string().optional(),
    socialLinks: z
      .object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        twitter: z.string().optional(),
        youtube: z.string().optional(),
        pinterest: z.string().optional(),
      })
      .optional(),
    seoDefaults: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        ogImageMedia: z.string().optional().nullable(),
      })
      .optional(),
    legalBusinessName: z.string().optional(),
    gstin: z.string().optional(),
    panNumber: z.string().optional(),
    registeredAddress: z
      .object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
    bankDetails: z
      .object({
        accountHolderName: z.string().optional(),
        accountNumber: z.string().optional(),
        ifscCode: z.string().optional(),
        bankName: z.string().optional(),
        branch: z.string().optional(),
      })
      .optional(),
    invoiceTerms: z.string().optional(),
  }),
});
