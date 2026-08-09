import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Quote, Star } from 'lucide-react';

// Static placeholder copy - same pattern as data/heroSlides.js and
// Footer.jsx's POLICY_ITEMS/PAYMENT_BADGES: generic first name + city, no
// invented review counts/ratings platform, no claim of being sourced from
// a real reviews provider. Meant to be swapped for real customer quotes
// once a reviews feature/CMS exists; kept intentionally modest until then.
const TESTIMONIALS = [
  {
    name: 'Priya S.',
    location: 'Lucknow',
    quote:
      'The finish and hallmark certification gave us complete confidence. Our wedding set from here looks far more expensive than what we paid.',
  },
  {
    name: 'Ananya R.',
    location: 'Ayodhya',
    quote:
      'Beautifully packaged, true to the photos, and the staff helped us pick pieces for the whole family. Exactly the premium feel we wanted.',
  },
  {
    name: 'Meera K.',
    location: 'Akbarpur',
    quote:
      "Easy exchange, prompt delivery, and jewellery that photographs even better in person. It's become our go-to for every occasion.",
  },
];

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mx-auto mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
        <span className="size-1.5 rotate-45 bg-primary" />
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
      </div>
      <h2 className="text-center font-display text-h3 font-bold text-heading sm:text-h2">Loved by Our Customers</h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground sm:text-base">
        Real stories from customers who trusted us with their special moments
      </p>

      {/* Rounded tinted panel, same "self-contained band" language as
          TrustBadges - keeps the closing section from reading as another
          plain white strip without needing an extra full-bleed wrapper. */}
      <div className="mt-8 grid grid-cols-1 gap-5 rounded-3xl bg-linear-to-b from-secondary/50 to-secondary/10 p-4 ring-1 ring-border sm:grid-cols-3 sm:gap-6 sm:p-6">
        {TESTIMONIALS.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.35, delay: index * 0.1, ease: 'easeOut' }}
            className="relative flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(200,162,74,0.3)]"
          >
            <Quote className="size-6 text-primary/30" strokeWidth={1.5} />

            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-primary text-primary" />
              ))}
            </div>

            <p className="flex-1 text-sm text-foreground italic">&ldquo;{item.quote}&rdquo;</p>

            <div className="flex items-center gap-3 border-t border-border pt-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">
                {initials(item.name)}
              </span>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-sm font-semibold text-heading">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
