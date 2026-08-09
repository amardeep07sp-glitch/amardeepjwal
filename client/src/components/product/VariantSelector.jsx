import { cn } from '@/lib/utils';

// Groups variants by attribute name (e.g. "Metal", "Necklace Length") into
// separate chip rows, and finds the variant matching the full combination
// of selections - handles a product with more than one variant dimension,
// not just a flat size list.
function buildAttributeGroups(variants) {
  const groups = [];
  const indexByName = new Map();

  for (const variant of variants) {
    for (const pair of variant.attributes) {
      const name = pair.attribute?.name;
      const value = pair.value?.value;
      if (!name || !value) continue;
      if (!indexByName.has(name)) {
        indexByName.set(name, groups.length);
        groups.push({ name, values: [] });
      }
      const group = groups[indexByName.get(name)];
      if (!group.values.includes(value)) group.values.push(value);
    }
  }

  return groups;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }) {
  if (!variants?.length) return null;

  const groups = buildAttributeGroups(variants);
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedValues = new Map((selectedVariant?.attributes ?? []).map((pair) => [pair.attribute?.name, pair.value?.value]));

  const handleSelect = (attributeName, value) => {
    const nextValues = new Map(selectedValues);
    nextValues.set(attributeName, value);

    const match = variants.find(
      (variant) =>
        variant.attributes.some((pair) => pair.attribute?.name === attributeName && pair.value?.value === value) &&
        variant.attributes.every((pair) => {
          const wanted = nextValues.get(pair.attribute?.name);
          return wanted === undefined || pair.value?.value === wanted;
        })
    );
    if (match) onSelect(match);
  };

  // A value counts as available if ANY variant carrying it is in stock - a
  // simple, honest heuristic (not a full per-combination solver), still a
  // real improvement over not checking stock at all.
  const isValueInStock = (attributeName, value) =>
    variants.some((v) => v.inStock && v.attributes.some((pair) => pair.attribute?.name === attributeName && pair.value?.value === value));

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isSelected = selectedValues.get(group.name) === value;
              const inStock = isValueInStock(group.name, value);

              return (
                <button
                  key={value}
                  type="button"
                  disabled={!inStock}
                  onClick={() => handleSelect(group.name, value)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex min-w-11 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground hover:border-primary/50',
                    !inStock && 'cursor-not-allowed border-border text-muted-foreground line-through opacity-50'
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
