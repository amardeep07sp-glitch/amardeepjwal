import { ApiError } from '../../utils/ApiError.js';
import { supplierNoteRepository } from './supplierNote.repository.js';
import { supplierAudit } from './supplier.audit.js';
import { SUPPLIER_TIMELINE_EVENTS } from './supplier.constants.js';

export const supplierNoteService = {
  listForSupplier(supplierId) {
    return supplierNoteRepository.findBySupplier(supplierId);
  },

  async createNote(supplierId, data, userId) {
    const note = await supplierNoteRepository.create({ ...data, supplier: supplierId, createdBy: userId });

    await supplierAudit.record({
      supplierId,
      event: SUPPLIER_TIMELINE_EVENTS.NOTE_ADDED,
      action: 'supplier.note_added',
      performedBy: userId,
    });

    return note;
  },

  async updateNote(id, data) {
    const note = await supplierNoteRepository.updateById(id, data);
    if (!note) throw new ApiError(404, 'Note not found');
    return note;
  },

  async deleteNote(id) {
    const deleted = await supplierNoteRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Note not found');
  },
};
