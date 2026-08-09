import { counterService } from '../shared/counter.service.js';

export const journalNumbering = {
  getNextJournalNumber: () => counterService.getNextSequence('journalNumber', { prefix: 'JRN', padLength: 7 }),
};
