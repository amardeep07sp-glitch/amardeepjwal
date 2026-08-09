import { jest } from '@jest/globals';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  findPublicByPosition: jest.fn(),
};

jest.unstable_mockModule('../src/modules/banner/banner.repository.js', () => ({
  bannerRepository: mockRepo,
}));

const { bannerService } = await import('../src/modules/banner/banner.service.js');

beforeEach(() => {
  Object.values(mockRepo).forEach((fn) => fn.mockReset());
});

describe('bannerService.createBanner', () => {
  it('rejects creating an active banner with no image attached', async () => {
    await expect(bannerService.createBanner({ title: 'Diwali Sale', isActive: true })).rejects.toThrow(
      'Banner requires an image before it can be activated'
    );
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('allows creating an inactive banner with no image (create-then-attach-media flow)', async () => {
    mockRepo.create.mockResolvedValue({ _id: 'b1', title: 'Diwali Sale', isActive: false, primaryMedia: null });

    await bannerService.createBanner({ title: 'Diwali Sale' });

    expect(mockRepo.create).toHaveBeenCalledWith({ title: 'Diwali Sale' });
  });

  it('allows creating an active banner when primaryMedia is provided', async () => {
    mockRepo.create.mockResolvedValue({ _id: 'b1', title: 'Diwali Sale', isActive: true, primaryMedia: 'm1' });

    await bannerService.createBanner({ title: 'Diwali Sale', isActive: true, primaryMedia: 'm1' });

    expect(mockRepo.create).toHaveBeenCalled();
  });
});

describe('bannerService.updateBanner', () => {
  it('rejects activating an existing banner that still has no image', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'b1', title: 'Diwali Sale', isActive: false, primaryMedia: null });

    await expect(bannerService.updateBanner('b1', { isActive: true })).rejects.toThrow(
      'Banner requires an image before it can be activated'
    );
    expect(mockRepo.updateById).not.toHaveBeenCalled();
  });

  it('allows activating once the banner already has primaryMedia set', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'b1', title: 'Diwali Sale', isActive: false, primaryMedia: 'm1' });
    mockRepo.updateById.mockResolvedValue({ _id: 'b1', title: 'Diwali Sale', isActive: true, primaryMedia: 'm1' });

    const result = await bannerService.updateBanner('b1', { isActive: true });

    expect(mockRepo.updateById).toHaveBeenCalledWith('b1', { isActive: true });
    expect(result.isActive).toBe(true);
  });

  it('throws 404 when the banner does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(bannerService.updateBanner('missing', { title: 'x' })).rejects.toThrow('Banner not found');
  });
});

describe('bannerService.getPublicBanners', () => {
  const HOUR = 60 * 60 * 1000;

  it('excludes a banner scheduled to start in the future', async () => {
    mockRepo.findPublicByPosition.mockResolvedValue([
      { _id: 'b1', title: 'Not Yet', startDate: new Date(Date.now() + HOUR), endDate: null },
    ]);

    const result = await bannerService.getPublicBanners('homepage_hero');

    expect(result).toEqual([]);
  });

  it('excludes a banner whose schedule already ended', async () => {
    mockRepo.findPublicByPosition.mockResolvedValue([
      { _id: 'b1', title: 'Expired', startDate: null, endDate: new Date(Date.now() - HOUR) },
    ]);

    const result = await bannerService.getPublicBanners('homepage_hero');

    expect(result).toEqual([]);
  });

  it('includes a banner with no schedule restriction, or one currently inside its window', async () => {
    const unscheduled = { _id: 'b1', title: 'Always On', startDate: null, endDate: null };
    const inWindow = {
      _id: 'b2',
      title: 'Live Now',
      startDate: new Date(Date.now() - HOUR),
      endDate: new Date(Date.now() + HOUR),
    };
    mockRepo.findPublicByPosition.mockResolvedValue([unscheduled, inWindow]);

    const result = await bannerService.getPublicBanners('homepage_hero');

    expect(result).toEqual([unscheduled, inWindow]);
    expect(mockRepo.findPublicByPosition).toHaveBeenCalledWith('homepage_hero');
  });
});
