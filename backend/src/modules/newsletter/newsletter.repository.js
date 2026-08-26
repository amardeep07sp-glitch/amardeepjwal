import { NewsletterSubscriber } from './newsletter.model.js';

export const newsletterRepository = {
  findByEmail(email) {
    return NewsletterSubscriber.findOne({ email });
  },

  create(email) {
    return NewsletterSubscriber.create({ email });
  },
};
