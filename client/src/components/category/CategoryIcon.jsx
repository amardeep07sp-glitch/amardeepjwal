import { Gem } from 'lucide-react';

// Shared by ShopByCategory (homepage) and AllCategoriesPage - a real
// uploaded icon if the admin set one, otherwise a generic Gem, never a
// broken <img>.
export function CategoryIcon({ category, className = 'size-5 sm:size-7' }) {
  if (category.iconMedia?.secureUrl) {
    return <img src={category.iconMedia.secureUrl} alt="" className="size-full rounded-full object-cover" loading="lazy" />;
  }
  return <Gem className={className} strokeWidth={1.5} />;
}
