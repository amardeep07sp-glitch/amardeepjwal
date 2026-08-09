import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { useBanners, useDeleteBanner } from './bannersApi';
import { BannerFormModal } from './BannerFormModal';
import { BANNER_POSITIONS } from './bannerSchema';

const positionLabel = (value) => BANNER_POSITIONS.find((p) => p.value === value)?.label ?? value;

export default function BannersListPage() {
  const { data: banners = [], isLoading, error, refetch } = useBanners();
  const deleteBanner = useDeleteBanner();

  const [formModalState, setFormModalState] = useState({ open: false, banner: null });
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const handleDeleteConfirm = async () => {
    try {
      await deleteBanner.mutateAsync(bannerToDelete.id);
      toast.success('Banner deleted successfully');
      setBannerToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'preview',
      header: '',
      headerClassName: 'w-16',
      render: (banner) => (
        <img
          src={banner.primaryMedia?.thumbnailUrl || banner.primaryMedia?.secureUrl}
          alt={banner.altText || banner.title}
          className="h-10 w-16 rounded-md border border-border object-cover"
        />
      ),
    },
    { key: 'title', header: 'Title' },
    { key: 'position', header: 'Position', render: (banner) => positionLabel(banner.position) },
    { key: 'order', header: 'Order' },
    {
      key: 'isActive',
      header: 'Status',
      render: (banner) => (
        <Badge variant={banner.isActive ? 'success' : 'secondary'}>
          {banner.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (banner) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${banner.title}`}
            onClick={() => setFormModalState({ open: true, banner })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${banner.title}`}
            onClick={() => setBannerToDelete(banner)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Banners</h1>
          <p className="text-sm text-muted-foreground">Manage promotional banners shown across the site.</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, banner: null })}>
          <Plus />
          New banner
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={banners}
        rowKey={(banner) => banner.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyTitle="No banners yet"
        emptyDescription="Create your first banner to feature it on the site."
      />

      <BannerFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, banner: open ? formModalState.banner : null })}
        banner={formModalState.banner}
      />

      <ConfirmDialog
        open={Boolean(bannerToDelete)}
        onOpenChange={(open) => !open && setBannerToDelete(null)}
        title="Delete this banner?"
        description={`"${bannerToDelete?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteBanner.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
