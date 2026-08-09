import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'address', label: 'Address' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
];

// A numbered-circle stepper, the standard checkout-progress pattern every
// real e-commerce checkout (Tanishq included) uses - a completed step gets
// a checkmark (not just a filled circle), so glancing at it mid-flow
// answers "what have I already done" as clearly as "what's next".
export function CheckoutStepper({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 sm:size-9',
                  isDone && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary/10 text-primary ring-2 ring-primary',
                  !isDone && !isActive && 'bg-secondary text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium tracking-wide uppercase sm:text-xs',
                  isActive || isDone ? 'text-heading' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn('mb-4 h-px w-8 transition-colors duration-300 sm:w-16', isDone ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
