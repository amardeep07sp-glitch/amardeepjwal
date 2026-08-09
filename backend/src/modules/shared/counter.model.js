import mongoose from 'mongoose';

// Generic atomic sequence generator - shared by Order/Invoice/Shipment
// numbering (no duplicate ad-hoc counters per module). _id IS the sequence
// name (e.g. 'orderNumber'), so an upsert+$inc is naturally scoped per
// sequence without needing a separate lookup field.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);
