import {
  Compass,
  Award,
  Sparkles,
  Crown,
  ShieldCheck,
  RotateCcw,
  Truck,
  Gem,
  Star,
  Heart,
  Gift,
  Clock,
  CheckCircle2,
  Flame,
  Diamond,
} from 'lucide-react';

// Matches backend/src/constants/catalog.js#BRAND_SHOWCASE_ICONS exactly -
// a brand's craft-pillar/trust-benefit `icon` field is one of these fixed
// keys (chosen from a dropdown in the admin form), never a free-text name,
// so a lookup miss can only mean "no icon set", never a typo to debug.
const ICON_MAP = { Compass, Award, Sparkles, Crown, ShieldCheck, RotateCcw, Truck, Gem, Star, Heart, Gift, Clock, CheckCircle2, Flame, Diamond };

export function getBrandShowcaseIcon(key) {
  return ICON_MAP[key] ?? Sparkles;
}
