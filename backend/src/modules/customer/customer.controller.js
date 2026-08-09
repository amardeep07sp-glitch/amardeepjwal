import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerService } from './customer.service.js';
import { serializeCustomer, serializeCustomerList } from './customer.serializer.js';
import { serializeCustomerTimelineList } from './customerTimeline.serializer.js';
import { serializeCustomerActivityList } from './customerActivity.serializer.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  res.status(200).json(
    new ApiResponse(200, { items: serializeCustomerList(result.items), meta: result.meta }, 'Customers fetched successfully')
  );
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Customer fetched successfully'));
});

export const getCustomerTimeline = asyncHandler(async (req, res) => {
  const timeline = await customerService.getTimeline(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeCustomerTimelineList(timeline), 'Customer timeline fetched successfully'));
});

export const getCustomerActivity = asyncHandler(async (req, res) => {
  const activity = await customerService.getActivity(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeCustomerActivityList(activity), 'Customer activity fetched successfully'));
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeCustomer(customer), 'Customer created successfully'));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Customer updated successfully'));
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Customer deleted successfully'));
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  await customerService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Customers updated successfully'));
});

export const assignTag = asyncHandler(async (req, res) => {
  const customer = await customerService.assignTag(req.params.id, req.params.tagId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Tag assigned successfully'));
});

export const removeTag = asyncHandler(async (req, res) => {
  const customer = await customerService.removeTag(req.params.id, req.params.tagId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Tag removed successfully'));
});

export const assignSegment = asyncHandler(async (req, res) => {
  const customer = await customerService.assignSegment(req.params.id, req.params.segmentId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Segment assigned successfully'));
});

export const removeSegment = asyncHandler(async (req, res) => {
  const customer = await customerService.removeSegment(req.params.id, req.params.segmentId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCustomer(customer), 'Segment removed successfully'));
});

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await customerService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});

export const getGrowthTrend = asyncHandler(async (req, res) => {
  const trend = await customerService.getGrowthTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Growth trend fetched successfully'));
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const { format = 'csv', ...filter } = req.query;

  if (format === 'excel') {
    const buffer = await customerService.exportCustomersExcel(filter);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="customers-export-${Date.now()}.xlsx"`);
    res.send(buffer);
    return;
  }

  const csv = await customerService.exportCustomersCsv(filter);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="customers-export-${Date.now()}.csv"`);
  res.send(csv);
});

export const importCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.importCustomersCsv(req.file.buffer, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Customer import processed'));
});

export const downloadStatement = asyncHandler(async (req, res) => {
  const pdfBuffer = await customerService.generateStatementPdf(req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="statement-${req.params.id}.pdf"`);
  res.send(pdfBuffer);
});
