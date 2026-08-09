import { serializeMediaRef } from '../media/media.serializer.js';

const serializeRef = (ref, fields = ['name']) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const shape = { id: ref._id.toString() };
  fields.forEach((f) => {
    shape[f] = ref[f];
  });
  return shape;
};

// `name` mirrors `displayName` - Phase 7's CustomerPickerSelect/NewOrderModal
// (built against the old User-backed stub) read `customer.name`, and this
// keeps that frontend code working unchanged against the new, richer
// Customer-backed implementation.
export const serializeCustomer = (customer) => {
  const plain = typeof customer.toObject === 'function' ? customer.toObject() : customer;

  return {
    id: plain._id,
    customerCode: plain.customerCode,
    firstName: plain.firstName,
    lastName: plain.lastName,
    displayName: plain.displayName,
    name: plain.displayName,
    email: plain.email,
    phone: plain.phone,
    dateOfBirth: plain.dateOfBirth,
    anniversary: plain.anniversary,
    gender: plain.gender,
    avatarMedia: serializeMediaRef(plain.avatarMedia),
    status: plain.status,
    leadSource: plain.leadSource,
    customerType: plain.customerType,
    gstNumber: plain.gstNumber,
    companyName: plain.companyName,
    preferredLanguage: plain.preferredLanguage,
    preferredCurrency: plain.preferredCurrency,
    preferredStore: serializeRef(plain.preferredStore, ['name', 'code']),
    referralCode: plain.referralCode,
    referredBy: serializeRef(plain.referredBy, ['displayName', 'customerCode']),
    tags: (plain.tags ?? []).map((t) => serializeRef(t, ['name', 'color'])),
    segments: (plain.segments ?? []).map((s) => serializeRef(s, ['name', 'color'])),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeCustomerList = (customers) => customers.map(serializeCustomer);
