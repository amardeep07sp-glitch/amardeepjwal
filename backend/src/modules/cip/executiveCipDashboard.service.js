import { Event } from './event.model.js';
import { orderRepository } from '../order/order.repository.js';
import { sessionService } from './session.service.js';
import { searchAnalyticsService } from './searchAnalytics.service.js';
import { productAnalyticsService } from './productAnalytics.service.js';
import { categoryAnalyticsService } from './categoryAnalytics.service.js';
import { marketingAnalyticsService } from './marketingAnalytics.service.js';
import { funnelAnalyticsService } from './funnelAnalytics.service.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// The spec's own flow diagram, realized: Orders/Inventory/CRM/Purchase all
// stay untouched (read-only) while every card/chart here is a thin reuse of
// an analytics service built earlier in this module, or of Order's own
// existing "returning customers" aggregate (Phase 7) - nothing here
// recomputes what another file already computes correctly.
export const executiveCipDashboardService = {
  async getDashboardCards() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeSessions, todaysSearches, returningCustomers, conversion] = await Promise.all([
      sessionService.getActiveSessionCount(),
      Event.countDocuments({ eventType: 'search', occurredAt: { $gte: startOfToday } }),
      orderRepository.countReturningCustomers(),
      this._getConversionRate({ dateFrom: startOfToday.toISOString() }),
    ]);

    return {
      realtimeVisitors: activeSessions,
      activeSessions,
      todaysSearches,
      returningCustomers,
      conversionRate: conversion.conversionRate,
    };
  },

  async _getConversionRate({ dateFrom, dateTo } = {}) {
    const dateMatch = {};
    if (dateFrom || dateTo) {
      dateMatch.occurredAt = {};
      if (dateFrom) dateMatch.occurredAt.$gte = new Date(dateFrom);
      if (dateTo) dateMatch.occurredAt.$lte = new Date(dateTo);
    }
    const [totalSessions, convertedSessions] = await Promise.all([
      Event.distinct('sessionId', dateMatch),
      Event.distinct('sessionId', { eventType: 'order_placed', ...dateMatch }),
    ]);
    return {
      totalSessions: totalSessions.length,
      convertedSessions: convertedSessions.length,
      conversionRate: totalSessions.length > 0 ? round2((convertedSessions.length / totalSessions.length) * 100) : 0,
    };
  },

  async getDashboardWidgets({ days = 14 } = {}) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);
    const params = { dateFrom: sinceDate.toISOString() };

    const [topProducts, topCategories, topBrands, topCampaigns, funnel] = await Promise.all([
      productAnalyticsService.getTopProducts({ ...params, limit: 8 }),
      categoryAnalyticsService.getCategoryPerformance({ ...params, limit: 8 }),
      productAnalyticsService.getTopBrands({ ...params, limit: 8 }),
      marketingAnalyticsService.getCampaignPerformance(params),
      funnelAnalyticsService.getFunnel(params),
    ]);

    return { topProducts, topCategories, topBrands, topCampaigns: topCampaigns.slice(0, 8), revenueFunnel: funnel };
  },
};
