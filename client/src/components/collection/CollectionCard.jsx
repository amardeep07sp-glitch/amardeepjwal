import { Link } from 'react-router-dom';
import { Gem } from 'lucide-react';

// Shared by the /collections index grid and the Related Collections strip
// on a collection's own detail page - one card, one look, everywhere.
export function CollectionCard({ collection }) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border transition-colors hover:ring-primary/50"
    >
      <div className="flex aspect-4/3 items-center justify-center overflow-hidden bg-secondary">
        {collection.thumbnailMedia ? (
          <img
            src={collection.thumbnailMedia.secureUrl}
            alt={collection.thumbnailMedia.altText || collection.name}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <Gem className="size-10 text-primary/40" strokeWidth={1.25} />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="font-display text-sm font-semibold text-heading">{collection.name}</p>
        {collection.shortDescription && <p className="line-clamp-2 text-xs text-muted-foreground">{collection.shortDescription}</p>}
      </div>
    </Link>
  );
}
