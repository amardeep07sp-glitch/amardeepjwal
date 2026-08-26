import { counterService } from '../shared/counter.service.js';

export const supportNumbering = {
  getNextTicketNumber: () => counterService.getNextSequence('ticketNumber', { prefix: 'TKT', padLength: 7 }),
  getNextIssueNumber: () => counterService.getNextSequence('issueNumber', { prefix: 'ISS', padLength: 7 }),
};
