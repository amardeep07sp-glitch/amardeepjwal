import { useEffect } from 'react';
import { usePublicSettings } from '@/features/settings/settingsApi';
import { HEADING_FONT_CSS, BODY_FONT_CSS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT } from '@/config/typography';

const STYLE_TAG_ID = 'dynamic-typography';

// Same "no visual output, just a side effect" shape as ScrollToTop/
// PageViewTracker (mounted alongside them in App.jsx).
//
// NOT a `--font-display`/`--font-sans` CSS-custom-property override - an
// earlier version of this component tried exactly that and looked right
// reading the source, but a live check (built CSS, not just assumption)
// showed Tailwind v4's `@theme inline` bakes each font utility's LITERAL
// resolved value straight into `.font-display`/`.font-sans` at build
// time (`.font-display{font-family:Playfair Display,serif}` in the
// compiled output, no `var()` in sight) - only utilities whose theme
// token was itself already a `var()` reference (`.font-heading`,
// `.font-price`) stayed dynamic. Overriding the CSS variable alone
// silently did nothing for the two utility classes that actually matter
// most (hero headings, body copy). Fixed by injecting a real stylesheet
// that overrides those utility classes directly, `!important` so it wins
// regardless of Tailwind's own layer/specificity - the standard technique
// for runtime-theming a Tailwind-compiled site.
export function ApplyTypography() {
  const { data: settings } = usePublicSettings();

  useEffect(() => {
    const headingFont = HEADING_FONT_CSS[settings?.typography?.headingFont] ?? HEADING_FONT_CSS[DEFAULT_HEADING_FONT];
    const bodyFont = BODY_FONT_CSS[settings?.typography?.bodyFont] ?? BODY_FONT_CSS[DEFAULT_BODY_FONT];

    let styleTag = document.getElementById(STYLE_TAG_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }

    // `.font-heading`/`.font-button`/`.font-price` already chain onto
    // `--font-sans` via var() in the compiled CSS, so overriding
    // `.font-sans` alone would cascade to them too - listed explicitly
    // anyway so this stylesheet is a complete, correct override on its
    // own and doesn't depend on that (currently-true, easily-changed-
    // later) implementation detail of index.css holding forever.
    styleTag.textContent = `
      .font-display { font-family: ${headingFont} !important; }
      body, .font-sans, .font-heading, .font-button, .font-price { font-family: ${bodyFont} !important; }
    `;
  }, [settings?.typography?.headingFont, settings?.typography?.bodyFont]);

  return null;
}
