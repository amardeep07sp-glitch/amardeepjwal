import { Drawer } from '@/components/global/Drawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { STATUS_BADGE_VARIANTS } from './categoryStatusMeta';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function CategoryPreviewDrawer({ open, onOpenChange, category }) {
  if (!category) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={category.name} description={`/${category.slug}`}>
      <div className="flex flex-col gap-4 py-4">
        {category.bannerMedia?.secureUrl && (
          <img
            src={category.bannerMedia.secureUrl}
            alt={category.name}
            className="h-32 w-full rounded-lg object-cover"
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[category.status]} className="capitalize">
            {category.status}
          </Badge>
          {category.isFeatured && <Badge variant="warning">Featured</Badge>}
          {category.showInNavbar && <Badge variant="outline">In navbar</Badge>}
          {category.showOnHomepage && <Badge variant="outline">On homepage</Badge>}
          {!category.isVisible && <Badge variant="secondary">Not visible</Badge>}
        </div>

        <DetailRow label="Parent category" value={category.parent?.name} />
        <DetailRow
          label="Products (incl. subcategories)"
          value={category.productCountRecursive ?? category.productCount}
        />
        <DetailRow label="Views" value={category.viewCount} />
        <DetailRow label="Clicks" value={category.clickCount} />
        <DetailRow label="Short description" value={category.shortDescription} />
        <DetailRow label="Description" value={category.description} />

        <Separator />
        <p className="text-sm font-medium text-heading">SEO</p>
        <DetailRow label="Meta title" value={category.seo?.metaTitle} />
        <DetailRow label="Meta description" value={category.seo?.metaDescription} />
        <DetailRow label="Meta keywords" value={category.seo?.metaKeywords} />
        <DetailRow label="Canonical URL" value={category.seo?.canonicalUrl} />
      </div>
    </Drawer>
  );
}
