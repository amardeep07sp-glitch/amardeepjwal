import { SegmentSnapshot } from './segmentSnapshot.model.js';

export const segmentSnapshotRepository = {
  upsert(customerId, segments, metrics) {
    return SegmentSnapshot.findOneAndUpdate(
      { customer: customerId },
      { $set: { segments, metrics, computedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  findBySegment(segmentKey, { page, limit }) {
    const filter = { segments: segmentKey };
    const skip = (page - 1) * limit;
    return Promise.all([
      SegmentSnapshot.find(filter).populate({ path: 'customer', select: 'displayName customerCode email phone' }).sort({ computedAt: -1 }).skip(skip).limit(limit),
      SegmentSnapshot.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total }));
  },

  getCounts() {
    return SegmentSnapshot.aggregate([{ $unwind: '$segments' }, { $group: { _id: '$segments', count: { $sum: 1 } } }]);
  },

  deleteAll() {
    return SegmentSnapshot.deleteMany({});
  },
};
