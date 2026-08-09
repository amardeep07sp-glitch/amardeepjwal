import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierNoteService } from './supplierNote.service.js';
import { serializeSupplierNote, serializeSupplierNoteList } from './supplierNote.serializer.js';

export const listNotes = asyncHandler(async (req, res) => {
  const notes = await supplierNoteService.listForSupplier(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, serializeSupplierNoteList(notes), 'Notes fetched successfully'));
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await supplierNoteService.createNote(req.params.supplierId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeSupplierNote(note), 'Note created successfully'));
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await supplierNoteService.updateNote(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeSupplierNote(note), 'Note updated successfully'));
});

export const deleteNote = asyncHandler(async (req, res) => {
  await supplierNoteService.deleteNote(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Note deleted successfully'));
});
