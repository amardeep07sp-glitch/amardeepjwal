import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductFacets } from '@/features/products/productsApi';
import { formatPrice } from '@/lib/format';

// Real category counts / price bounds / tags (product.service.js's
// getPublicFacets) - not the arbitrary numbers a mockup shows. Selections
// are staged locally and only take effect on "Apply Filters" (or reset on
// "Clear All"), matching the reference design and avoiding a refetch per
// checkbox click.
export function ProductFilterSidebar({ filters, onApply, onClear, hideCategoryFacet = false, hideBrandFacet = false }) {
  const { data: facets, isLoading } = useProductFacets();

  const [categories, setCategories] = useState(filters.categories);
  const [brands, setBrands] = useState(filters.brands ?? []);
  const [tags, setTags] = useState(filters.tags);
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? '');
  const [gender, setGender] = useState(filters.gender ?? '');
  const [occasion, setOccasion] = useState(filters.occasion ?? []);

  // Re-sync staged state when the applied filters change from outside this
  // component (browser back/forward, or a "Clear All" triggered elsewhere).
  useEffect(() => {
    setCategories(filters.categories);
    setBrands(filters.brands ?? []);
    setTags(filters.tags);
    setMinPrice(filters.minPrice ?? '');
    setMaxPrice(filters.maxPrice ?? '');
    setGender(filters.gender ?? '');
    setOccasion(filters.occasion ?? []);
  }, [filters]);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleApply = () => {
    onApply({
      categories,
      brands,
      tags,
      minPrice: minPrice === '' ? undefined : Number(minPrice),
      maxPrice: maxPrice === '' ? undefined : Number(maxPrice),
      gender: gender || undefined,
      occasion,
    });
  };

  const handleClear = () => {
    setCategories([]);
    setBrands([]);
    setTags([]);
    setMinPrice('');
    setMaxPrice('');
    setGender('');
    setOccasion([]);
    onClear();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-heading uppercase">Filters</h2>
        <button type="button" onClick={handleClear} className="text-xs font-medium text-primary hover:underline">
          Clear All
        </button>
      </div>

      {!hideCategoryFacet && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Category</p>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !facets?.categories?.length ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {facets.categories.map((cat) => (
                <Label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
                  <Checkbox checked={categories.includes(cat.slug)} onCheckedChange={() => toggle(categories, setCategories, cat.slug)} />
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">({cat.productCount})</span>
                </Label>
              ))}
            </div>
          )}
        </div>
      )}

      {!hideBrandFacet && facets?.brands?.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Brand</p>
          <div className="flex flex-col gap-2.5">
            {facets.brands.map((b) => (
              <Label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
                <Checkbox checked={brands.includes(b.slug)} onCheckedChange={() => toggle(brands, setBrands, b.slug)} />
                <span className="flex-1">{b.name}</span>
                <span className="text-xs text-muted-foreground">({b.productCount})</span>
              </Label>
            ))}
          </div>
        </div>
      )}

      {facets?.priceRange && facets.priceRange.max > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Price Range</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-sm"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatPrice(facets.priceRange.min)} - {formatPrice(facets.priceRange.max)}
          </p>
        </div>
      )}

      {facets?.genders?.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Gender</p>
          <div className="flex flex-col gap-2.5">
            {facets.genders.map((g) => (
              <Label key={g.value} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
                <Checkbox
                  checked={gender === g.value}
                  onCheckedChange={() => setGender((prev) => (prev === g.value ? '' : g.value))}
                />
                <span className="flex-1">{g.label}</span>
                <span className="text-xs text-muted-foreground">({g.count})</span>
              </Label>
            ))}
          </div>
        </div>
      )}

      {facets?.occasions?.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Occasion</p>
          <div className="flex flex-col gap-2.5">
            {facets.occasions.map((o) => (
              <Label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground">
                <Checkbox checked={occasion.includes(o.value)} onCheckedChange={() => toggle(occasion, setOccasion, o.value)} />
                <span className="flex-1">{o.label}</span>
                <span className="text-xs text-muted-foreground">({o.count})</span>
              </Label>
            ))}
          </div>
        </div>
      )}

      {facets?.tags?.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tags</p>
          <div className="flex flex-col gap-2.5">
            {facets.tags.map((t) => (
              <Label key={t.tag} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-foreground capitalize">
                <Checkbox checked={tags.includes(t.tag)} onCheckedChange={() => toggle(tags, setTags, t.tag)} />
                <span className="flex-1">{t.tag}</span>
                <span className="text-xs text-muted-foreground">({t.count})</span>
              </Label>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleApply} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}
