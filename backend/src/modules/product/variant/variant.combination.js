// Pure, dependency-free logic for the variant system. Kept isolated so both
// the Mongoose model (combination key, for its uniqueness index) and the
// generator service (cartesian product) share one implementation.

// Deterministic identity for a set of {attribute, value} pairs, independent
// of the order they were supplied in. Two variants with the same pairs in
// any order must produce the same key.
export function buildCombinationKey(attributes = []) {
  return [...attributes]
    .map((pair) => `${pair.attribute.toString()}:${pair.value.toString()}`)
    .sort()
    .join('|');
}

// attributeGroups: [{ attributeId, valueIds: [id, id, ...] }, ...]
// Returns every combination as an array of { attribute, value } pairs - the
// cartesian product across all provided attribute groups.
export function generateAttributeCombinations(attributeGroups = []) {
  return attributeGroups.reduce(
    (combinations, group) => {
      const next = [];
      for (const combo of combinations) {
        for (const valueId of group.valueIds) {
          next.push([...combo, { attribute: group.attributeId, value: valueId }]);
        }
      }
      return next;
    },
    [[]]
  );
}
