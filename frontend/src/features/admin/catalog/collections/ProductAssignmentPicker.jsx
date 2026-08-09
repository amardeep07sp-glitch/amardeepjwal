import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/global/SearchInput';
import { EmptyState } from '@/components/global/EmptyState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProducts, useUpdateProduct } from '../products/productsApi';

// Manual-assignment membership IS Product.collectionId (Collection Engine
// v2.0 reuses the existing single-ref field exactly as before this phase) -
// assigning/unassigning a product here is a real PUT /products/:id, not a
// staged local list, since that's genuinely where the data lives. A search
// Input + checkbox-style list inside a Popover gets the same "search then
// add" UX as a combobox without introducing cmdk as a new dependency.
export function ProductAssignmentPicker({ collectionId }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: assignedData, isLoading } = useProducts({ collectionId, limit: 100 });
  const assigned = assignedData?.items ?? [];

  const { data: searchData } = useProducts({ search, limit: 20 }, { enabled: popoverOpen && search.trim().length > 0 });
  const searchResults = (searchData?.items ?? []).filter((p) => p.collectionId?.id !== collectionId);

  const updateProduct = useUpdateProduct();

  const assign = async (product) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, payload: { collectionId } });
      toast.success(`Added "${product.name}"`);
      setPopoverOpen(false);
      setSearch('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const unassign = async (product) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, payload: { collectionId: null } });
      toast.success(`Removed "${product.name}"`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Plus className="size-4" />
            Add product
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products by name or SKU..." />
          <div className="mt-2 flex max-h-60 flex-col gap-1 overflow-y-auto">
            {search.trim().length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Type to search the catalog.</p>
            ) : searchResults.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No matching products.</p>
            ) : (
              searchResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => assign(product)}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="truncate">{product.name}</span>
                  <span className="text-xs text-muted-foreground">{product.sku}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading assigned products...</p>
      ) : assigned.length === 0 ? (
        <EmptyState title="No products assigned yet" description="Use “Add product” above to assign products manually." />
      ) : (
        <div className="flex flex-col gap-2">
          {assigned.map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-heading">{product.name}</span>
                <span className="text-xs text-muted-foreground">{product.sku}</span>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${product.name}`} onClick={() => unassign(product)}>
                <X className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
