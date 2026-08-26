import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const CATALOG_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  published: 'success',
  hidden: 'warning',
  archived: 'destructive',
};

// Kept in sync with backend/src/constants/catalog.js#BRAND_SHOWCASE_ICONS -
// a fixed lookup key, not a free-text icon name, so a craft-pillar/trust-
// benefit card can never end up with a broken/blank icon from a typo.
export const BRAND_SHOWCASE_ICONS = [
  'Compass',
  'Award',
  'Sparkles',
  'Crown',
  'ShieldCheck',
  'RotateCcw',
  'Truck',
  'Gem',
  'Star',
  'Heart',
  'Gift',
  'Clock',
  'CheckCircle2',
  'Flame',
  'Diamond',
];

const editionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  localName: z.string().optional(),
  tagline: z.string().optional(),
  categorySlug: z.string().optional(),
});

const craftPillarSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const trustBenefitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// Entirely optional - a plain catalog brand leaves every one of these
// blank. Only a flagship brand meant to render as its own landing page
// (see client/src/pages/BrandShowcasePage.jsx) fills this in.
const showcaseSchema = z.object({
  heroTagline: z.string().optional(),
  heroLocalName: z.string().optional(),
  heroImageMedia: mediaRefSchema,
  storyTitle: z.string().optional(),
  storyBody: z.string().optional(),
  storyImageMedia: mediaRefSchema,
  editions: z.array(editionSchema).max(8).default([]),
  craftPillars: z.array(craftPillarSchema).max(8).default([]),
  trustBenefits: z.array(trustBenefitSchema).max(8).default([]),
});

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  logoMedia: mediaRefSchema,
  bannerMedia: mediaRefSchema,
  country: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(CATALOG_STATUSES.map((s) => s.value)).default('draft'),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  order: z.coerce.number().default(0),
  showcase: showcaseSchema,
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImageMedia: mediaRefSchema,
  }),
});

export const brandFormDefaults = {
  name: '',
  slug: '',
  description: '',
  logoMedia: null,
  bannerMedia: null,
  country: '',
  website: '',
  status: 'draft',
  isFeatured: false,
  isVisible: true,
  order: 0,
  showcase: {
    heroTagline: '',
    heroLocalName: '',
    heroImageMedia: null,
    storyTitle: '',
    storyBody: '',
    storyImageMedia: null,
    editions: [],
    craftPillars: [],
    trustBenefits: [],
  },
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', ogImageMedia: null },
};
