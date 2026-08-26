import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockRedis = { get: jest.fn(), set: jest.fn() };
jest.unstable_mockModule('../src/config/redis.js', () => ({ redisClient: mockRedis }));

const { resolveTrafficSource, resolveLocationFromIp, resolveLocationFromCoords } = await import('../src/modules/cip/geo.util.js');

beforeEach(() => {
  mockRedis.get.mockReset();
  mockRedis.set.mockReset();
  mockRedis.get.mockResolvedValue(null);
});

describe('resolveTrafficSource', () => {
  it('classifies direct traffic when there is no referrer and no UTM', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: '' })).toBe('direct');
  });

  it('classifies a known UTM source directly', () => {
    expect(resolveTrafficSource({ utmSource: 'google', referrer: '' })).toBe('google');
  });

  it('classifies an unrecognized UTM source as a generic campaign', () => {
    expect(resolveTrafficSource({ utmSource: 'newsletter_blast', referrer: '' })).toBe('campaign');
  });

  it('classifies a known referrer host when there is no UTM', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.facebook.com/somepage' })).toBe('facebook');
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.instagram.com/p/xyz' })).toBe('instagram');
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://www.google.com/search?q=rings' })).toBe('google');
  });

  it('classifies an unrecognized referrer as generic referral traffic', () => {
    expect(resolveTrafficSource({ utmSource: '', referrer: 'https://some-jewellery-blog.example.com/article' })).toBe('referral');
  });

  it('UTM always wins over a referrer, even a recognizable one', () => {
    expect(resolveTrafficSource({ utmSource: 'email', referrer: 'https://www.facebook.com/somepage' })).toBe('email');
  });
});

describe('resolveLocationFromIp', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('never calls the provider for loopback/private IPs', async () => {
    global.fetch = jest.fn();
    const result = await resolveLocationFromIp('127.0.0.1');
    expect(result).toEqual({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns a cached location without calling the provider', async () => {
    const cached = { country: 'India', state: 'Maharashtra', city: 'Mumbai', approxLat: 19.1, approxLng: 72.9, timezone: 'Asia/Kolkata' };
    mockRedis.get.mockResolvedValue(JSON.stringify(cached));
    global.fetch = jest.fn();

    const result = await resolveLocationFromIp('49.36.1.1');

    expect(result).toEqual(cached);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resolves from the provider, rounds coordinates to city-level precision, and caches the result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, country: 'India', region: 'Maharashtra', city: 'Mumbai', latitude: 19.076, longitude: 72.8777, timezone: { id: 'Asia/Kolkata' } }),
    });

    const result = await resolveLocationFromIp('49.36.1.1');

    expect(result).toEqual({ country: 'India', state: 'Maharashtra', city: 'Mumbai', approxLat: 19.1, approxLng: 72.9, timezone: 'Asia/Kolkata' });
    expect(mockRedis.set).toHaveBeenCalledWith('geoip:49.36.1.1', JSON.stringify(result), 'EX', expect.any(Number));
  });

  it('falls back to an empty location without throwing when the provider fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await resolveLocationFromIp('49.36.1.1');

    expect(result).toEqual({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' });
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('falls back to an empty location when the provider reports failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) });

    const result = await resolveLocationFromIp('49.36.1.1');

    expect(result).toEqual({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' });
  });
});

describe('resolveLocationFromCoords', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects out-of-range coordinates without calling the provider', async () => {
    global.fetch = jest.fn();
    const result = await resolveLocationFromCoords(200, 500);
    expect(result).toEqual({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('resolves a real lat/lng into city/state/country and caches it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ address: { country: 'India', state: 'Maharashtra', city: 'Mumbai' } }),
    });

    const result = await resolveLocationFromCoords(19.076, 72.8777);

    expect(result).toEqual({ country: 'India', state: 'Maharashtra', city: 'Mumbai', approxLat: 19.1, approxLng: 72.9, timezone: '' });
    expect(mockRedis.set).toHaveBeenCalledWith('geocode:19.08:72.88', JSON.stringify(result), 'EX', expect.any(Number));
  });

  it('returns a cached location without calling the provider', async () => {
    const cached = { country: 'India', state: 'Karnataka', city: 'Bengaluru', approxLat: 12.9, approxLng: 77.6, timezone: '' };
    mockRedis.get.mockResolvedValue(JSON.stringify(cached));
    global.fetch = jest.fn();

    const result = await resolveLocationFromCoords(12.9716, 77.5946);

    expect(result).toEqual(cached);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls back to an empty location without throwing when the provider fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    const result = await resolveLocationFromCoords(19.076, 72.8777);
    expect(result).toEqual({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' });
  });
});
