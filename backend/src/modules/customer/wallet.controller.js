import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { walletService } from './wallet.service.js';
import { serializeWallet, serializeWalletLedgerEntry, serializeWalletLedgerList } from './wallet.serializer.js';

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWallet(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializeWallet(wallet), 'Wallet fetched successfully'));
});

export const getWalletLedger = asyncHandler(async (req, res) => {
  const result = await walletService.getLedger(req.params.customerId, req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeWalletLedgerList(result.items), meta: result.meta }, 'Wallet ledger fetched successfully')
  );
});

export const recordWalletTransaction = asyncHandler(async (req, res) => {
  const entry = await walletService.recordTransaction({
    customerId: req.params.customerId,
    ...req.body,
    performedBy: req.user._id,
  });
  res.status(201).json(new ApiResponse(201, serializeWalletLedgerEntry(entry), 'Wallet transaction recorded successfully'));
});
