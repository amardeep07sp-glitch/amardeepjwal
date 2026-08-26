import { newsletterRepository } from './newsletter.repository.js';

export const newsletterService = {
  // Idempotent - resubmitting an already-subscribed email is a normal
  // success, not a 409. A visitor re-entering their email (they forgot
  // they'd already signed up) should never see an error for it.
  async subscribe(email) {
    const existing = await newsletterRepository.findByEmail(email);
    if (existing) return existing;
    return newsletterRepository.create(email);
  },
};
