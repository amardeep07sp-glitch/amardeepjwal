import { describe, it, expect } from '@jest/globals';
import { buildDateRangeMatch, buildPaginationMeta, paginateStages, buildSortStage } from '../src/modules/reports/reportFilters.util.js';

describe('reportFilters.util', () => {
  describe('buildDateRangeMatch', () => {
    it('returns null when neither bound is given', () => {
      expect(buildDateRangeMatch('createdAt', undefined, undefined)).toBeNull();
    });

    it('builds a $gte-only range when only dateFrom is given', () => {
      const match = buildDateRangeMatch('createdAt', '2026-01-01', undefined);
      expect(match).toEqual({ createdAt: { $gte: new Date('2026-01-01') } });
    });

    it('builds a full range when both bounds are given', () => {
      const match = buildDateRangeMatch('date', '2026-01-01', '2026-01-31');
      expect(match).toEqual({ date: { $gte: new Date('2026-01-01'), $lte: new Date('2026-01-31') } });
    });
  });

  describe('buildPaginationMeta', () => {
    it('computes totalPages, rounding up', () => {
      expect(buildPaginationMeta(1, 20, 45)).toEqual({ page: 1, limit: 20, totalItems: 45, totalPages: 3 });
    });

    it('never reports fewer than 1 total page, even for zero items', () => {
      expect(buildPaginationMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, totalItems: 0, totalPages: 1 });
    });
  });

  describe('paginateStages', () => {
    it('computes $skip from (page-1)*limit and passes $limit through', () => {
      expect(paginateStages(3, 10)).toEqual([{ $skip: 20 }, { $limit: 10 }]);
    });

    it('never produces a negative skip for page 0 or below', () => {
      expect(paginateStages(0, 10)).toEqual([{ $skip: 0 }, { $limit: 10 }]);
    });
  });

  describe('buildSortStage', () => {
    it('defaults to descending on the fallback field when nothing is given', () => {
      expect(buildSortStage(undefined, undefined)).toEqual({ createdAt: -1 });
    });

    it('honors an explicit ascending sort', () => {
      expect(buildSortStage('name', 'asc')).toEqual({ name: 1 });
    });
  });
});
