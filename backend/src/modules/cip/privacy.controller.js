import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { privacyService } from './privacy.service.js';
import { consentService } from './consent.service.js';

// Public - self-service erasure by the visitor's own client-held
// visitorId (nothing else identifies them, by design - this module never
// asks for a name/email to serve this request).
export const deleteMyData = asyncHandler(async (req, res) => {
  const result = await privacyService.deleteVisitorData(req.params.visitorId);
  res.status(200).json(new ApiResponse(200, result, 'Visitor data deleted successfully'));
});

// Admin-only - erasure by Customer identity (a data-subject request that
// named the customer, not just a browser).
export const deleteCustomerData = asyncHandler(async (req, res) => {
  const result = await privacyService.deleteCustomerData(req.params.customerId);
  res.status(200).json(new ApiResponse(200, result, 'Customer analytics data deleted successfully'));
});

export const setConsent = asyncHandler(async (req, res) => {
  const { visitorId, ...preferences } = req.body;
  const consent = await consentService.setConsent(visitorId, preferences);
  res.status(200).json(new ApiResponse(200, consent, 'Consent preferences saved'));
});

export const getConsent = asyncHandler(async (req, res) => {
  const consent = await consentService.getConsent(req.params.visitorId);
  res.status(200).json(new ApiResponse(200, consent, 'Consent preferences fetched'));
});
