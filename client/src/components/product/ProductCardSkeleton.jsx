import { Skeleton } from '@/components/ui/skeleton';

// Same box model as ProductCard so a grid/carousel never jumps when real
// data replaces these while loading.
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-1 h-8 w-full" />
      </div>
    </div>
  );
}
