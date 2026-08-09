import { Drawer } from '@/components/global/Drawer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { STATUS_BADGE_VARIANTS } from './productSchema';

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function ProductPreviewDrawer({ open, onOpenChange, product }) {
  if (!product) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={product.name} description={`SKU: ${product.sku}`}>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[product.status]} className="capitalize">
            {product.status}
          </Badge>
          {product.isFeatured && <Badge variant="warning">Featured</Badge>}
          {!product.isVisible && <Badge variant="secondary">Not visible</Badge>}
        </div>

        <DetailRow label="Slug" value={`/${product.slug}`} />
        <DetailRow label="Category" value={product.category?.name} />
        <DetailRow label="Brand" value={product.brand?.name} />
        <DetailRow label="Collection" value={product.collectionId?.name} />
        <DetailRow
          label="Attribute groups"
          value={product.attributeGroups?.map((g) => g.name).join(', ')}
        />
        <DetailRow label="Tags" value={product.tags?.join(', ')} />
        <DetailRow label="Short description" value={product.shortDescription} />
        <DetailRow label="Description" value={product.description} />

        <Separator />
        <p className="text-sm font-medium text-heading">SEO</p>
        <DetailRow label="Meta title" value={product.seo?.metaTitle} />
        <DetailRow label="Meta description" value={product.seo?.metaDescription} />
        <DetailRow label="Meta keywords" value={product.seo?.metaKeywords} />
      </div>
    </Drawer>
  );
}
