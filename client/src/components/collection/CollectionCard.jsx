import { Link } from 'react-router-dom';
import { ArrowRight, Gem } from 'lucide-react';

// Shared by the /collections index grid and the Related Collections strip
// on a collection's own detail page - one card, one look, everywhere.
export function CollectionCard({ collection }) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:border-primary/30"
    >
      <div className="flex aspect-4/3 items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 via-secondary to-secondary">
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
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-base font-semibold text-heading group-hover:text-primary transition-colors">{collection.name}</p>
          <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        {collection.shortDescription && <p className="line-clamp-2 text-xs text-muted-foreground">{collection.shortDescription}</p>}
      </div>
    </Link>
  );
}
