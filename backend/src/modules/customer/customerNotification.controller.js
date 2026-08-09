import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerService } from './customer.service.js';
import { customerNotifications } from './customer.notifications.js';
import { customerNotificationRepository } from './customerNotification.repository.js';
import { serializeNotificationList } from './customerNotification.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const listNotifications = asyncHandler(async (req, res) => {
  const { items, total } = await customerNotificationRepository.findPaginated(req.params.customerId, req.query);
  res.status(200).json(
    new ApiResponse(
      200,
      { items: serializeNotificationList(items), meta: buildPaginationMeta(req.query.page, req.query.limit, total) },
      'Notifications fetched successfully'
    )
  );
});

export const sendNotification = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.customerId);
  await customerNotifications.send(customer, req.body);
  res.status(200).json(new ApiResponse(200, null, 'Notification sent'));
});
