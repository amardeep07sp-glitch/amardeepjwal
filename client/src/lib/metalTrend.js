import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

// Shared between MetalRateStrip (homepage ticker) and GoldRatePage (full
// rate table) - both render the same 'up' | 'down' | 'same' | null trend
// that metalRate.serializer.js computes server-side. Colors are left to
// each caller since the two live on very different backgrounds (dark
// ribbon vs. light card).
export const METAL_TREND_ICON = { up: TrendingUp, down: TrendingDown, same: Minus };
