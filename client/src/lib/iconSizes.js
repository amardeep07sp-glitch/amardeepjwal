// Named icon-size tokens - lucide-react icons take a plain `className`, so
// "centralizing" icon sizing means centralizing which Tailwind `size-*`
// utility each named tier maps to, not a new runtime mechanism. Tailwind's
// own spacing scale already lands on every pixel value the design system
// calls for (size-4 = 16px, size-4.5 = 18px, ...) - this is just the one
// place that mapping is named, so a component reads `ICON_SIZE.md` instead
// of a bare `size-5` a reviewer has to mentally convert to "20px".
export const ICON_SIZE = Object.freeze({
  xs: 'size-4', // 16px
  sm: 'size-4.5', // 18px
  md: 'size-5', // 20px
  lg: 'size-6', // 24px
  xl: 'size-7', // 28px
  '2xl': 'size-8', // 32px
  '3xl': 'size-10', // 40px
  '4xl': 'size-12', // 48px
});

export const iconSize = (name) => ICON_SIZE[name] ?? ICON_SIZE.md;
