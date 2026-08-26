import { FormField } from '@/components/global/FormField';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCategoryTree } from '../catalog/categories/categoriesApi';
import { flattenTreeForParentOptions } from '../catalog/categories/categoryTreeOptions';
import { useBrands } from '../catalog/brands/brandsApi';
import { useCollections } from '../catalog/collections/collectionsApi';
import { METALS, PURITIES_BY_METAL, GEMSTONE_TYPES } from '../catalog/products/productSchema';
import { CheckboxMultiSelect } from './CheckboxMultiSelect';
import { EntitySearchPicker } from './EntitySearchPicker';
import { useProductSearch } from './entitySearchHooks';

// All purities across every metal, deduplicated - a scope isn't required
// to also restrict `metals`, so purity options can't be narrowed to just
// the selected metals' own list (an admin may scope by purity alone, e.g.
// "22K" regardless of metal).
const ALL_PURITIES = [...new Set(Object.values(PURITIES_BY_METAL).flat())].map((p) => ({ value: p, label: p }));

// Every include/exclude/metals/purities/etc dimension here is optional and
// ANDs together (see backend promotionRules.service.js's own header
// comment) - an empty field means "no restriction", not "matches nothing".
// `scope` here is the FORM's own shape, not the API's: includeProducts/
// excludeProducts carry {id, label} pairs (so already-selected ones show a
// real name without a resolve-by-id round trip); every other array is
// plain ids, matching the API directly. CouponFormModal converts products
// to plain ids on submit.
export function CouponScopeBuilder({ scope, onChange }) {
  const { data: categoryTree = [] } = useCategoryTree();
  const categoryOptions = flattenTreeForParentOptions(categoryTree, undefined).map((c) => ({ value: c.id, label: c.name }));
  const { data: brandsData } = useBrands({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const brandOptions = (brandsData?.items ?? []).map((b) => ({ value: b.id, label: b.name }));
  const { data: collectionsData } = useCollections({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const collectionOptions = (collectionsData?.items ?? []).map((c) => ({ value: c.id, label: c.name }));

  const set = (patch) => onChange({ ...scope, ...patch });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Eligible products" description="Leave empty to allow all products (subject to the other filters below)">
          <EntitySearchPicker
            selectedEntities={scope.includeProducts}
            onChange={(entities) => set({ includeProducts: entities })}
            useSearchHook={useProductSearch}
            getLabel={(p) => p.name}
            getSubLabel={(p) => p.sku}
            searchPlaceholder="Search products by name or SKU..."
            emptyLabel="Type to search the catalog."
            addLabel="Add product"
          />
        </FormField>
        <FormField label="Excluded products" description="Never eligible, even if matched by another rule below">
          <EntitySearchPicker
            selectedEntities={scope.excludeProducts}
            onChange={(entities) => set({ excludeProducts: entities })}
            useSearchHook={useProductSearch}
            getLabel={(p) => p.name}
            getSubLabel={(p) => p.sku}
            searchPlaceholder="Search products by name or SKU..."
            emptyLabel="Type to search the catalog."
            addLabel="Add product"
          />
        </FormField>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Include categories" description="Also matches sub-categories">
          <CheckboxMultiSelect
            options={categoryOptions}
            value={scope.includeCategories}
            onChange={(v) => set({ includeCategories: v })}
            emptyLabel="No categories yet."
          />
        </FormField>
        <FormField label="Exclude categories" description="Also excludes sub-categories">
          <CheckboxMultiSelect
            options={categoryOptions}
            value={scope.excludeCategories}
            onChange={(v) => set({ excludeCategories: v })}
            emptyLabel="No categories yet."
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Include collections">
          <CheckboxMultiSelect
            options={collectionOptions}
            value={scope.includeCollections}
            onChange={(v) => set({ includeCollections: v })}
            emptyLabel="No collections yet."
          />
        </FormField>
        <FormField label="Exclude collections">
          <CheckboxMultiSelect
            options={collectionOptions}
            value={scope.excludeCollections}
            onChange={(v) => set({ excludeCollections: v })}
            emptyLabel="No collections yet."
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Include brands">
          <CheckboxMultiSelect options={brandOptions} value={scope.includeBrands} onChange={(v) => set({ includeBrands: v })} emptyLabel="No brands yet." />
        </FormField>
        <FormField label="Exclude brands">
          <CheckboxMultiSelect options={brandOptions} value={scope.excludeBrands} onChange={(v) => set({ excludeBrands: v })} emptyLabel="No brands yet." />
        </FormField>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Metal" description="e.g. Gold-only offers">
          <CheckboxMultiSelect options={METALS} value={scope.metals} onChange={(v) => set({ metals: v })} emptyLabel="No metals." />
        </FormField>
        <FormField label="Purity" description="e.g. 22K-only offers">
          <CheckboxMultiSelect options={ALL_PURITIES} value={scope.purities} onChange={(v) => set({ purities: v })} emptyLabel="No purities." />
        </FormField>
        <FormField label="Gemstone" description="e.g. Diamond-only offers">
          <CheckboxMultiSelect options={GEMSTONE_TYPES} value={scope.gemstoneTypes} onChange={(v) => set({ gemstoneTypes: v })} emptyLabel="No gemstones." />
        </FormField>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Min product price" htmlFor="scope-minPrice">
          <Input
            id="scope-minPrice"
            type="number"
            min="0"
            placeholder="No minimum"
            value={scope.minPrice ?? ''}
            onChange={(e) => set({ minPrice: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </FormField>
        <FormField label="Max product price" htmlFor="scope-maxPrice">
          <Input
            id="scope-maxPrice"
            type="number"
            min="0"
            placeholder="No maximum"
            value={scope.maxPrice ?? ''}
            onChange={(e) => set({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={Boolean(scope.excludeSaleProducts)} onCheckedChange={(v) => set({ excludeSaleProducts: v })} />
        Exclude products already on sale (their own MRP vs. selling price discount)
      </label>
    </div>
  );
}
