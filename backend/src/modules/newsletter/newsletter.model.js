import mongoose from 'mongoose';

// One row per unique email - re-subscribing an already-subscribed address
// is a no-op success (see newsletter.service.js), never a duplicate row.
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
