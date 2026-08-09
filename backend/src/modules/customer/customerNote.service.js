import { ApiError } from '../../utils/ApiError.js';
import { customerNoteRepository } from './customerNote.repository.js';
import { customerAudit } from './customer.audit.js';
import { CUSTOMER_TIMELINE_EVENTS } from './customer.constants.js';

export const customerNoteService = {
  listForCustomer(customerId) {
    return customerNoteRepository.findByCustomer(customerId);
  },

  async createNote(customerId, data, userId) {
    const note = await customerNoteRepository.create({ ...data, customer: customerId, createdBy: userId });

    await customerAudit.record({
      customerId,
      event: CUSTOMER_TIMELINE_EVENTS.NOTE_ADDED,
      action: 'customer.note_added',
      performedBy: userId,
    });

    return note;
  },

  async updateNote(id, data) {
    const note = await customerNoteRepository.updateById(id, data);
    if (!note) throw new ApiError(404, 'Note not found');
    return note;
  },

  async deleteNote(id) {
    const deleted = await customerNoteRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Note not found');
  },
};
