import crypto from 'crypto';
import { counterService } from '../shared/counter.service.js';

export const customerNumbering = {
  getNextCustomerCode: () => counterService.getNextSequence('customerCode', { prefix: 'CUST', padLength: 6 }),

  // Short, human-shareable, not sequential (a guessable sequential referral
  // code would let anyone enumerate other customers' codes) - random,
  // checked for collision by the caller via customerRepository.findByReferralCode.
  generateReferralCode: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
};
