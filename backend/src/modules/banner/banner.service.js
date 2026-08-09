import { ApiError } from '../../utils/ApiError.js';
import { bannerRepository } from './banner.repository.js';

const assertReadyToActivate = (isActive, primaryMedia) => {
  if (isActive && !primaryMedia) {
    throw new ApiError(400, 'Banner requires an image before it can be activated');
  }
};

export const bannerService = {
  listBanners() {
    return bannerRepository.findAll();
  },

  async createBanner(data) {
    assertReadyToActivate(data.isActive ?? false, data.primaryMedia ?? null);
    return bannerRepository.create(data);
  },

  async updateBanner(id, data) {
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Banner not found');

    const resultantIsActive = data.isActive ?? existing.isActive;
    const resultantPrimaryMedia = data.primaryMedia !== undefined ? data.primaryMedia : existing.primaryMedia;
    assertReadyToActivate(resultantIsActive, resultantPrimaryMedia);

    const banner = await bannerRepository.updateById(id, data);
    if (!banner) throw new ApiError(404, 'Banner not found');
    return banner;
  },

  async deleteBanner(id) {
    const banner = await bannerRepository.deleteById(id);
    if (!banner) throw new ApiError(404, 'Banner not found');
    return banner;
  },

  // Public storefront read - active + imaged banners for a position,
  // additionally narrowed to whichever are inside their scheduled window
  // right now (a null startDate/endDate means "no restriction" on that end).
  async getPublicBanners(position) {
    const banners = await bannerRepository.findPublicByPosition(position);
    const now = Date.now();
    return banners.filter((banner) => {
      const startsOk = !banner.startDate || new Date(banner.startDate).getTime() <= now;
      const endsOk = !banner.endDate || new Date(banner.endDate).getTime() >= now;
      return startsOk && endsOk;
    });
  },
};
