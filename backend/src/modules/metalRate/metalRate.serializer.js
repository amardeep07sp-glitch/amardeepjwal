import { METAL_FIELDS } from './metalRate.model.js';

const previousFieldName = (field) => `previous${field[0].toUpperCase()}${field.slice(1)}`;

// null when there's no previous value to compare against yet (e.g. a field
// that has never changed since the singleton was created) - the storefront
// treats null as "no trend arrow", not "flat".
const getTrend = (current, previous) => {
  if (!(previous > 0) || current == null) return null;
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
};

export const serializeMetalRate = (rate) => {
  const plain = typeof rate.toObject === 'function' ? rate.toObject() : rate;
  const trend = Object.fromEntries(
    METAL_FIELDS.map((field) => [field, getTrend(plain[field], plain[previousFieldName(field)])])
  );

  return {
    gold24k: plain.gold24k,
    gold22k: plain.gold22k,
    gold18k: plain.gold18k,
    silver: plain.silver,
    unit: plain.unit,
    updatedAt: plain.updatedAt,
    trend,
  };
};
