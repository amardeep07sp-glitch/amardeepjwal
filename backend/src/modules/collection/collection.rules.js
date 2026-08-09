import { RULE_FIELDS, RULE_OPERATORS, RULE_MATCH_MODES } from './collection.constants.js';

// Pure, DB-free filter building (same convention as
// inventory.stockStatus.js/priceCalculator.js) - turns a Rule Builder
// condition into a Mongo filter clause against Product's own fields. `stock`
// is the one field that can't be expressed directly (stock lives in
// Inventory, not Product) - the caller pre-resolves a matching id set via
// inventoryRepository + resolveStockStatus and passes it in as
// `inStockProductIds`; buildClause turns that into an `_id: {$in}` clause.
function buildClause(condition, { inStockProductIds } = {}) {
  const { field, operator, value } = condition;

  switch (field) {
    case RULE_FIELDS.CATEGORY:
      return { category: operator === RULE_OPERATORS.NOT_IN ? { $nin: value } : { $in: value } };

    case RULE_FIELDS.BRAND:
      return { brand: operator === RULE_OPERATORS.NOT_IN ? { $nin: value } : { $in: value } };

    case RULE_FIELDS.TAGS:
      return { tags: operator === RULE_OPERATORS.NOT_IN ? { $nin: value } : { $in: value } };

    case RULE_FIELDS.ATTRIBUTES:
      // Group-membership only ("has this attribute group") - Product only
      // stores attribute-group refs, not value pairs (those live on
      // Variant). True value-level rules are a real, scoped v1.1 follow-up.
      return { attributeGroups: { $in: value } };

    case RULE_FIELDS.STATUS:
      return { status: operator === RULE_OPERATORS.NOT_IN ? { $nin: value } : { $in: value } };

    case RULE_FIELDS.FEATURED:
      return { isFeatured: Boolean(value) };

    case RULE_FIELDS.PRICE: {
      if (operator === RULE_OPERATORS.BETWEEN) {
        const range = {};
        if (value?.min !== undefined) range.$gte = value.min;
        if (value?.max !== undefined) range.$lte = value.max;
        return { 'pricing.finalPrice': range };
      }
      if (operator === RULE_OPERATORS.GTE) return { 'pricing.finalPrice': { $gte: value } };
      if (operator === RULE_OPERATORS.LTE) return { 'pricing.finalPrice': { $lte: value } };
      return { 'pricing.finalPrice': value };
    }

    case RULE_FIELDS.STOCK:
      // Never "everything" if nothing matched the stock criterion - an
      // empty id set fails closed, same discipline as the whole-rule-set
      // empty-conditions case below.
      return { _id: { $in: inStockProductIds ?? [] } };

    default:
      // Unknown field - fail closed rather than silently matching everything.
      return { _id: { $in: [] } };
  }
}

// { matchMode: 'all'|'any', conditions: [...] } -> a Mongo filter object over
// Product. An empty condition list matches nothing (fail-closed) - an
// automatic collection with no rules configured yet should never silently
// show the entire catalog.
export function buildRuleFilter({ matchMode, conditions } = {}, { inStockProductIds } = {}) {
  if (!conditions?.length) return { _id: { $in: [] } };

  const clauses = conditions.map((condition) => buildClause(condition, { inStockProductIds }));
  if (clauses.length === 1) return clauses[0];

  return matchMode === RULE_MATCH_MODES.ANY ? { $or: clauses } : { $and: clauses };
}
