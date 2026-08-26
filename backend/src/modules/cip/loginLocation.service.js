import { loginLocationRepository } from './loginLocation.repository.js';
import { resolveLocationFromCoords } from './geo.util.js';

export const loginLocationService = {
  // Fire-and-forget from the controller's point of view (storefront.routes.js)
  // - resolveLocationFromCoords already never throws (geo.util.js's
  // established discipline), so a slow/failed geocode never blocks or
  // fails the request that triggered it.
  async recordLogin(customerId, { lat, lng }) {
    const location = await resolveLocationFromCoords(lat, lng);
    if (!location.approxLat) return null; // never store a row with nothing real to show
    return loginLocationRepository.create({ customer: customerId, ...location });
  },

  async getRecentPoints(limit = 500) {
    const rows = await loginLocationRepository.findRecent(limit);
    return rows.map((r) => ({
      id: r._id,
      lat: r.approxLat,
      lng: r.approxLng,
      city: r.city,
      state: r.state,
      country: r.country,
      createdAt: r.createdAt,
    }));
  },

  getStateBreakdown() {
    return loginLocationRepository.getStateBreakdown();
  },
};
