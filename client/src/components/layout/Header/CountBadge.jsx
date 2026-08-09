import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Hand-rolled instead of `react-countup` - that package's CJS build
// re-wraps its own default export, so under Vite's ESM interop
// `import CountUp from 'react-countup'` resolves to the whole module
// object ({ default, useCountUp }), not the component itself, and React
// throws "Element type is invalid". This avoids depending on that
// broken interop entirely.
function useCountUp(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return undefined;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

// The little gold pill on Wishlist/Cart icons. Pops in on mount and
// re-counts whenever the value changes (add-to-cart, add-to-wishlist) -
// stays out of the way (renders nothing) at zero so an empty cart doesn't
// show a "0" badge.
export function CountBadge({ value }) {
  const display = useCountUp(value);

  return (
    <AnimatePresence>
      {value > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
        >
          {display}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
