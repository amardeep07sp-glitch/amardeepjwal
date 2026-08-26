import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { broadcastService } from './broadcast.service.js';
import { serializeBroadcast, serializeBroadcastList, serializeWebsiteBroadcastList } from './broadcast.serializer.js';

export const createBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await broadcastService.createBroadcast(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeBroadcast(broadcast), 'Broadcast started - sending in the background'));
});

export const listBroadcasts = asyncHandler(async (req, res) => {
  const { items, meta } = await broadcastService.listBroadcasts(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeBroadcastList(items), meta }, 'Broadcasts fetched successfully'));
});

export const getBroadcastById = asyncHandler(async (req, res) => {
  const broadcast = await broadcastService.getBroadcastById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeBroadcast(broadcast), 'Broadcast fetched successfully'));
});

export const deactivateBroadcast = asyncHandler(async (req, res) => {
  const broadcast = await broadcastService.deactivateBroadcast(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeBroadcast(broadcast), 'Broadcast deactivated'));
});

export const getActiveWebsiteBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await broadcastService.getActiveWebsiteBroadcasts();
  res.status(200).json(new ApiResponse(200, serializeWebsiteBroadcastList(broadcasts), 'Active broadcasts fetched successfully'));
});
