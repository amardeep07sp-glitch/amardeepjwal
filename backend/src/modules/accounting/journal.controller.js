import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { journalService } from './journal.service.js';
import { serializeJournal, serializeJournalList } from './journal.serializer.js';
import { serializeJournalLineList } from './journal.serializer.js';

export const listJournals = asyncHandler(async (req, res) => {
  const result = await journalService.listJournals(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeJournalList(result.items), meta: result.meta }, 'Journals fetched successfully'));
});

export const getJournalById = asyncHandler(async (req, res) => {
  const { journal, lines } = await journalService.getJournalById(req.params.id);
  res.status(200).json(
    new ApiResponse(200, { journal: serializeJournal(journal), lines: serializeJournalLineList(lines) }, 'Journal fetched successfully')
  );
});

export const createManualJournal = asyncHandler(async (req, res) => {
  const journal = await journalService.createManualJournal(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeJournal(journal), 'Journal posted successfully'));
});

export const reverseJournal = asyncHandler(async (req, res) => {
  const journal = await journalService.reverseJournal(req.params.id, { reason: req.body.reason, performedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, serializeJournal(journal), 'Reversing journal posted successfully'));
});
