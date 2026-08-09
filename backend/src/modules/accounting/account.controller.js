import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { accountService } from './account.service.js';
import { serializeAccount, serializeAccountList } from './account.serializer.js';

export const listAccounts = asyncHandler(async (req, res) => {
  const result = await accountService.listAccounts(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeAccountList(result.items), meta: result.meta }, 'Accounts fetched successfully'));
});

export const listAllAccounts = asyncHandler(async (req, res) => {
  const accounts = await accountService.listAll(req.query.type ? { type: req.query.type, active: true } : { active: true });
  res.status(200).json(new ApiResponse(200, serializeAccountList(accounts), 'Accounts fetched successfully'));
});

export const getAccountById = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeAccount(account), 'Account fetched successfully'));
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await accountService.createAccount(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeAccount(account), 'Account created successfully'));
});

export const updateAccount = asyncHandler(async (req, res) => {
  const account = await accountService.updateAccount(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeAccount(account), 'Account updated successfully'));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await accountService.deleteAccount(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Account deleted successfully'));
});
