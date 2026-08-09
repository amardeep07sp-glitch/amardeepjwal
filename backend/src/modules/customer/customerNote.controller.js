import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerNoteService } from './customerNote.service.js';
import { serializeNote, serializeNoteList } from './customerNote.serializer.js';

export const listNotes = asyncHandler(async (req, res) => {
  const notes = await customerNoteService.listForCustomer(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializeNoteList(notes), 'Notes fetched successfully'));
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await customerNoteService.createNote(req.params.customerId, req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeNote(note), 'Note created successfully'));
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await customerNoteService.updateNote(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeNote(note), 'Note updated successfully'));
});

export const deleteNote = asyncHandler(async (req, res) => {
  await customerNoteService.deleteNote(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Note deleted successfully'));
});
