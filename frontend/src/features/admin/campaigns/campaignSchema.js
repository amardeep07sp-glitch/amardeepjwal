import { z } from 'zod';

// Must match backend/src/modules/campaign/campaign.constants.js exactly.
export const CAMPAIGN_TYPES = [
  { value: 'diwali', label: 'Diwali' },
  { value: 'akshaya_tritiya', label: 'Akshaya Tritiya' },
  { value: 'valentine', label: 'Valentine' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'raksha_bandhan', label: 'Raksha Bandhan' },
  { value: 'festive', label: 'Festive' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'new_collection', label: 'New Collection' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'first_purchase', label: 'First Purchase' },
  { value: 'reactivation', label: 'Reactivation' },
  { value: 'custom', label: 'Custom' },
];

// SCHEDULED/EXPIRED/EXHAUSTED are always computed server-side
// (campaign.service.js#computeEffectiveStatus) and never settable here -
// but ACTIVE itself must be, since it's what actually moves a campaign out
// of draft: storing status="active" isn't a manual override, it's telling
// the server "stop holding this back, let the real dates/budget decide"
// (computeEffectiveStatus falls through active/scheduled/expired/exhausted
// to date/budget math - only draft/paused/cancelled/archived short-circuit
// it). Without this option a freshly created campaign could never leave
// draft through the admin UI.
export const CAMPAIGN_MANUAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active (let dates/budget decide)' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
];

export const CAMPAIGN_EFFECTIVE_STATUS_VARIANTS = {
  draft: 'secondary',
  scheduled: 'info',
  active: 'success',
  paused: 'warning',
  exhausted: 'warning',
  expired: 'secondary',
  cancelled: 'destructive',
  archived: 'secondary',
};

const optionalPositiveNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().min(0).optional()
);

export const campaignSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    campaignType: z.enum(CAMPAIGN_TYPES.map((t) => t.value)),
    startAt: z.string().min(1, 'Start date is required'),
    endAt: z.string().min(1, 'End date is required'),
    priority: z.coerce.number().optional(),
    budget: optionalPositiveNumber,
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: 'End date must be after start date',
    path: ['endAt'],
  });

export const campaignFormDefaults = {
  name: '',
  description: '',
  campaignType: 'custom',
  startAt: '',
  endAt: '',
  priority: 0,
  budget: '',
  tags: [],
};
