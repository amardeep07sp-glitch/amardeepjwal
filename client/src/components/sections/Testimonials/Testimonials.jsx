import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Quote, Star } from 'lucide-react';
import { useFeaturedReviews } from '@/features/reviews/reviewsApi';
import { Skeleton } from '@/components/ui/skeleton';

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Real customer reviews (review.repository.js#findFeatured - approved,
// 4-5 star, with actual written text), not invented names/quotes. Renders
// nothing at all on a fresh store with zero qualifying reviews yet, rather
// than falling back to placeholder copy - an empty section beats a fake one.
export function Testimonials() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const { data: reviews, isLoading } = useFeaturedReviews(6);

  if (!isLoading && (!reviews || reviews.length === 0)) return null;

  return (
    <section ref={ref} className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mx-auto mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
        <span className="size-1.5 rotate-45 bg-primary" />
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
      </div>
      <h2 className="text-center font-display text-h3 font-bold text-heading sm:text-h2">Loved by Our Customers</h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground sm:text-base">
        Real reviews from customers who trusted us with their special moments
      </p>

      {/* Rounded tinted panel, same "self-contained band" language as
          TrustBadges - keeps the closing section from reading as another
          plain white strip without needing an extra full-bleed wrapper. */}
      <div className="mt-8 grid grid-cols-1 gap-5 rounded-3xl bg-linear-to-b from-secondary/50 to-secondary/10 p-4 ring-1 ring-border sm:grid-cols-3 sm:gap-6 sm:p-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-border">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-16 w-full" />
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          : reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: index * 0.1, ease: 'easeOut' }}
                className="relative flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(200,162,74,0.3)]"
              >
                <Quote className="size-6 text-primary/30" strokeWidth={1.5} />

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < review.rating ? 'size-3.5 fill-primary text-primary' : 'size-3.5 text-muted-foreground/30'} />
                    ))}
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold text-success uppercase">
                      Verified Purchase
                    </span>
                  )}
                </div>

                <p className="flex-1 text-sm text-foreground italic">&ldquo;{review.title ? `${review.title} - ` : ''}{review.comment}&rdquo;</p>

                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {initials(review.reviewerName)}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-semibold text-heading">{review.reviewerName}</p>
                    {review.product && (
                      <Link to={`/products/${review.product.slug}`} className="truncate text-xs text-muted-foreground hover:text-primary hover:underline">
                        {review.product.name}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
      </div>
    </section>
  );
}
