import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/global/SearchInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Generic "search then add" multi-picker for scope/eligibility fields that
// reference a large collection (Products, Customers) - too many rows for a
// plain checkbox list, unlike Categories/Brands/Collections. Manages a
// plain array of ids on the form; `selectedEntities` carries the
// {id, label} pairs to render (from the coupon's own populated scope on
// edit, or freshly picked this session) since a raw id alone has no name
// to show. Same "Popover + SearchInput" shape as
// catalog/collections/ProductAssignmentPicker.jsx, generalized to write
// into a form field instead of PUTing a relation directly.
export function EntitySearchPicker({ selectedEntities, onChange, useSearchHook, getLabel, getSubLabel, searchPlaceholder, emptyLabel, addLabel }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: searchData, isFetching } = useSearchHook(search);
  const searchResults = (searchData ?? []).filter((entity) => !selectedEntities.some((s) => s.id === entity.id));

  const add = (entity) => {
    onChange([...selectedEntities, { id: entity.id, label: getLabel(entity) }]);
    setPopoverOpen(false);
    setSearch('');
  };

  const remove = (id) => onChange(selectedEntities.filter((s) => s.id !== id));

  return (
    <div className="flex flex-col gap-2">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-fit">
            <Plus className="size-4" />
            {addLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
          <div className="mt-2 flex max-h-60 flex-col gap-1 overflow-y-auto">
            {search.trim().length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">{emptyLabel}</p>
            ) : isFetching ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No matches.</p>
            ) : (
              searchResults.map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => add(entity)}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="truncate">{getLabel(entity)}</span>
                  {getSubLabel && <span className="text-xs text-muted-foreground">{getSubLabel(entity)}</span>}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEntities.map((entity) => (
            <span key={entity.id} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              {entity.label}
              <button type="button" onClick={() => remove(entity.id)} aria-label={`Remove ${entity.label}`}>
                <X className="size-3 text-muted-foreground hover:text-destructive" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
