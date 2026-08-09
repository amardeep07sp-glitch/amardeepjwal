import mongoose from 'mongoose';
import { SHIPMENT_STATUSES } from './order.constants.js';

const orderShipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    shipmentNumber: { type: String, required: true, unique: true },
    // Which OrderItems this specific shipment covers - enables partial
    // shipment (an order can have more than one OrderShipment).
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    courier: { type: String, trim: true, default: '' },
    trackingNumber: { type: String, trim: true, default: '' },
    trackingUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(SHIPMENT_STATUSES), default: SHIPMENT_STATUSES.PENDING, index: true },
    estimatedDelivery: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const OrderShipment = mongoose.model('OrderShipment', orderShipmentSchema);
