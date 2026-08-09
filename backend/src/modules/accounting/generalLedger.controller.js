import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { generalLedgerService } from './generalLedger.service.js';

export const getAccountLedger = asyncHandler(async (req, res) => {
  const ledger = await generalLedgerService.getAccountLedger(req.params.accountId, req.query);
  res.status(200).json(new ApiResponse(200, ledger, 'Account ledger fetched successfully'));
});

export const getTrialBalance = asyncHandler(async (req, res) => {
  const trialBalance = await generalLedgerService.getTrialBalance(req.query.asOfDate);
  res.status(200).json(new ApiResponse(200, trialBalance, 'Trial balance fetched successfully'));
});
