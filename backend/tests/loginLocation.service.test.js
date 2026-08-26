import { jest } from '@jest/globals';

const mockRepo = { create: jest.fn(), findRecent: jest.fn(), getStateBreakdown: jest.fn() };
jest.unstable_mockModule('../src/modules/cip/loginLocation.repository.js', () => ({ loginLocationRepository: mockRepo }));

const mockResolveLocationFromCoords = jest.fn();
jest.unstable_mockModule('../src/modules/cip/geo.util.js', () => ({ resolveLocationFromCoords: mockResolveLocationFromCoords }));

const { loginLocationService } = await import('../src/modules/cip/loginLocation.service.js');

beforeEach(() => {
  mockRepo.create.mockReset();
  mockRepo.findRecent.mockReset();
  mockRepo.getStateBreakdown.mockReset();
  mockResolveLocationFromCoords.mockReset();
});

describe('loginLocationService.recordLogin', () => {
  it('stores a row when the coordinates resolve to a real location', async () => {
    mockResolveLocationFromCoords.mockResolvedValue({ country: 'India', state: 'Maharashtra', city: 'Mumbai', approxLat: 19.1, approxLng: 72.9 });
    mockRepo.create.mockResolvedValue({ _id: 'row1' });

    await loginLocationService.recordLogin('customer1', { lat: 19.076, lng: 72.8777 });

    expect(mockRepo.create).toHaveBeenCalledWith({
      customer: 'customer1',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      approxLat: 19.1,
      approxLng: 72.9,
    });
  });

  it('never stores a row when the coordinates could not be resolved (e.g. denied/failed geocode)', async () => {
    mockResolveLocationFromCoords.mockResolvedValue({ country: '', state: '', city: '', approxLat: null, approxLng: null });

    const result = await loginLocationService.recordLogin('customer1', { lat: 19.076, lng: 72.8777 });

    expect(result).toBeNull();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});

describe('loginLocationService.getRecentPoints', () => {
  it('maps stored rows into flat map-friendly points', async () => {
    mockRepo.findRecent.mockResolvedValue([
      { _id: 'row1', approxLat: 19.1, approxLng: 72.9, city: 'Mumbai', state: 'Maharashtra', country: 'India', createdAt: new Date('2026-01-01') },
    ]);

    const result = await loginLocationService.getRecentPoints(500);

    expect(result).toEqual([
      { id: 'row1', lat: 19.1, lng: 72.9, city: 'Mumbai', state: 'Maharashtra', country: 'India', createdAt: new Date('2026-01-01') },
    ]);
    expect(mockRepo.findRecent).toHaveBeenCalledWith(500);
  });
});
