import { buildRuleFilter } from '../src/modules/collection/collection.rules.js';

describe('buildRuleFilter', () => {
  it('fails closed (matches nothing) for an empty condition list', () => {
    expect(buildRuleFilter({ matchMode: 'all', conditions: [] })).toEqual({ _id: { $in: [] } });
  });

  it('builds a category $in filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'category', operator: 'in', value: ['cat1'] }] });
    expect(filter).toEqual({ category: { $in: ['cat1'] } });
  });

  it('builds a brand $nin filter for not_in', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'brand', operator: 'not_in', value: ['b1'] }] });
    expect(filter).toEqual({ brand: { $nin: ['b1'] } });
  });

  it('builds a tags $in filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'tags', operator: 'in', value: ['festive'] }] });
    expect(filter).toEqual({ tags: { $in: ['festive'] } });
  });

  it('builds an attribute-group membership filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'attributes', operator: 'in', value: ['grp1'] }] });
    expect(filter).toEqual({ attributeGroups: { $in: ['grp1'] } });
  });

  it('builds a status $in filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'status', operator: 'in', value: ['published'] }] });
    expect(filter).toEqual({ status: { $in: ['published'] } });
  });

  it('builds a featured boolean filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'featured', operator: 'equals', value: true }] });
    expect(filter).toEqual({ isFeatured: true });
  });

  it('builds a price range filter for a between operator', () => {
    const filter = buildRuleFilter({
      matchMode: 'all',
      conditions: [{ field: 'price', operator: 'between', value: { min: 1000, max: 5000 } }],
    });
    expect(filter).toEqual({ 'pricing.finalPrice': { $gte: 1000, $lte: 5000 } });
  });

  it('builds a price gte filter', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'price', operator: 'gte', value: 1000 }] });
    expect(filter).toEqual({ 'pricing.finalPrice': { $gte: 1000 } });
  });

  it('injects the pre-resolved stock id set for a stock condition', () => {
    const filter = buildRuleFilter(
      { matchMode: 'all', conditions: [{ field: 'stock', operator: 'equals', value: 'in_stock' }] },
      { inStockProductIds: ['p1', 'p2'] }
    );
    expect(filter).toEqual({ _id: { $in: ['p1', 'p2'] } });
  });

  it('fails closed for a stock condition when no id set was resolved', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'stock', operator: 'equals', value: 'in_stock' }] });
    expect(filter).toEqual({ _id: { $in: [] } });
  });

  it('combines multiple conditions with $and when matchMode is all', () => {
    const filter = buildRuleFilter({
      matchMode: 'all',
      conditions: [
        { field: 'category', operator: 'in', value: ['cat1'] },
        { field: 'featured', operator: 'equals', value: true },
      ],
    });
    expect(filter).toEqual({ $and: [{ category: { $in: ['cat1'] } }, { isFeatured: true }] });
  });

  it('combines multiple conditions with $or when matchMode is any', () => {
    const filter = buildRuleFilter({
      matchMode: 'any',
      conditions: [
        { field: 'category', operator: 'in', value: ['cat1'] },
        { field: 'featured', operator: 'equals', value: true },
      ],
    });
    expect(filter).toEqual({ $or: [{ category: { $in: ['cat1'] } }, { isFeatured: true }] });
  });

  it('fails closed for an unknown rule field', () => {
    const filter = buildRuleFilter({ matchMode: 'all', conditions: [{ field: 'bogus', operator: 'equals', value: 1 }] });
    expect(filter).toEqual({ _id: { $in: [] } });
  });
});
