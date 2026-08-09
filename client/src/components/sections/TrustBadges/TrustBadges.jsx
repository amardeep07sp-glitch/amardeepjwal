import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, ShieldCheck, Truck, Undo2 } from 'lucide-react';
import { SUPPORT_PHONE } from '@/config/appConfig';

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: '100% Certified', subtitle: 'Hallmarked Jewellery' },
  { icon: Truck, title: 'Free Insured Shipping', subtitle: 'Across India' },
  { icon: Undo2, title: 'Easy Returns', subtitle: '15 Days Return Policy' },
  { icon: ShieldCheck, title: 'Secure Payment', subtitle: '100% Secure Checkout' },
  { icon: Headphones, title: 'Customer Support', subtitle: SUPPORT_PHONE },
];

// Fades each badge up as the strip scrolls into view - `triggerOnce` so it
// never replays while scrolling past it a second time.
export function TrustBadges() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-linear-to-b from-secondary/60 to-secondary/20 p-4 ring-1 ring-border sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-5 lg:gap-5">
        {TRUST_ITEMS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
            className="group flex items-center gap-3 rounded-xl bg-card/60 p-2.5 ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-md hover:ring-primary/20"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
              <item.icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-semibold text-heading">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
