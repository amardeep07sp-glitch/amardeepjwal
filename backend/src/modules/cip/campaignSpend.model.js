import mongoose from 'mongoose';

// "ROAS Ready" - nothing in the event stream can ever know what a campaign
// COST (ad spend lives in Google/Meta's own ad accounts, not this system);
// an admin records it here so marketingAnalytics.service.js can compute a
// real Return on Ad Spend against the revenue CIP DOES know about
// (order_placed events attributed to that utmCampaign).
const campaignSpendSchema = new mongoose.Schema(
  {
    utmCampaign: { type: String, required: true, trim: true, index: true },
    spend: { type: Number, required: true, min: 0 },
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const CampaignSpend = mongoose.model('CampaignSpend', campaignSpendSchema);
