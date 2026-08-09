import { ApiError } from '../../utils/ApiError.js';
import { customerSegmentRepository } from './customerSegment.repository.js';

const SYSTEM_SEGMENTS = ['Retail', 'Wholesale', 'VIP', 'Gold', 'Silver', 'Corporate', 'Dealer', 'Distributor'];

export const customerSegmentService = {
  listSegments() {
    return customerSegmentRepository.findAll();
  },

  async getSegmentById(id) {
    const segment = await customerSegmentRepository.findById(id);
    if (!segment) throw new ApiError(404, 'Segment not found');
    return segment;
  },

  // Idempotent bootstrap - called once at server startup, same pattern as
  // warehouseService.ensureDefaultWarehouse(). Safe to call on every boot.
  async ensureSystemSegments() {
    for (const name of SYSTEM_SEGMENTS) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await customerSegmentRepository.findByName(name);
      if (!existing) {
        // eslint-disable-next-line no-await-in-loop
        await customerSegmentRepository.create({ name, isSystemDefined: true });
      }
    }
  },

  createSegment(data) {
    return customerSegmentRepository.create({ ...data, isSystemDefined: false });
  },

  async updateSegment(id, data) {
    const segment = await customerSegmentRepository.updateById(id, data);
    if (!segment) throw new ApiError(404, 'Segment not found');
    return segment;
  },

  async deleteSegment(id) {
    const segment = await customerSegmentRepository.findById(id);
    if (!segment) throw new ApiError(404, 'Segment not found');
    if (segment.isSystemDefined) throw new ApiError(400, 'System-defined segments cannot be deleted');
    await customerSegmentRepository.deleteById(id);
  },
};
