import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { ConfirmDialog } from '@/components/global/ConfirmDialog';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useCampaigns, useDeleteCampaign, useSetCampaignStatus } from './campaignsApi';
import { CampaignFormModal } from './CampaignFormModal';
import { CAMPAIGN_TYPES, CAMPAIGN_MANUAL_STATUSES, CAMPAIGN_EFFECTIVE_STATUS_VARIANTS } from './campaignSchema';

const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const typeLabel = (value) => CAMPAIGN_TYPES.find((t) => t.value === value)?.label ?? value;

// Only the manual states (draft/paused/cancelled/archived) are ever
// admin-settable - scheduled/active/exhausted/expired are always derived
// server-side from real startAt/endAt/budget data, so they're excluded
// from this dropdown's own option list even though they're valid
// effectiveStatus values shown as badges.
function StatusChanger({ campaign }) {
  const setStatus = useSetCampaignStatus();
  return (
    <Select
      value={campaign.status}
      onValueChange={(status) =>
        setStatus.mutate(
          { id: campaign.id, status },
          { onError: (err) => toast.error(err.message) }
        )
      }
    >
      <SelectTrigger className="h-8 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CAMPAIGN_MANUAL_STATUSES.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CampaignsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [formModalState, setFormModalState] = useState({ open: false, campaign: null });
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useCampaigns({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: searchTerm || undefined,
  });
  const deleteCampaign = useDeleteCampaign();

  const campaigns = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      toast.success('Campaign deleted successfully');
      setCampaignToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Campaign',
      render: (c) => (
        <div>
          <span className="font-medium text-heading">{c.name}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{typeLabel(c.campaignType)}</p>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget spent',
      render: (c) =>
        c.budget != null ? (
          <span className="text-sm">
            ₹{c.spentBudget.toLocaleString('en-IN')} / ₹{c.budget.toLocaleString('en-IN')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">₹{c.spentBudget.toLocaleString('en-IN')} (unlimited)</span>
        ),
    },
    {
      key: 'validity',
      header: 'Duration',
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(c.startAt)} - {formatDate(c.endAt)}
        </span>
      ),
    },
    {
      key: 'effectiveStatus',
      header: 'Live status',
      render: (c) => (
        <Badge variant={CAMPAIGN_EFFECTIVE_STATUS_VARIANTS[c.effectiveStatus] ?? 'secondary'} className="capitalize">
          {c.effectiveStatus}
        </Badge>
      ),
    },
    { key: 'status', header: 'Set status', render: (c) => <StatusChanger campaign={c} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (campaign) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${campaign.name}`} onClick={() => setFormModalState({ open: true, campaign })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${campaign.name}`} onClick={() => setCampaignToDelete(campaign)}>
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
          <h1 className="text-h4 font-semibold text-heading">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Group coupon codes under a shared budget, dates and marketing intent (e.g. a Diwali sale).</p>
        </div>
        <Button onClick={() => setFormModalState({ open: true, campaign: null })}>
          <Plus />
          New campaign
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name..."
        emptyTitle="No campaigns yet"
        emptyDescription="Create a campaign to group coupon codes under a shared budget and date range."
        pagination={{
          page: meta.page,
          totalPages: meta.totalPages,
          totalItems: meta.totalItems,
          pageSize: DEFAULT_PAGE_SIZE,
          onPageChange: setPage,
        }}
      />

      <CampaignFormModal
        open={formModalState.open}
        onOpenChange={(open) => setFormModalState({ open, campaign: open ? formModalState.campaign : null })}
        campaign={formModalState.campaign}
      />

      <ConfirmDialog
        open={Boolean(campaignToDelete)}
        onOpenChange={(open) => !open && setCampaignToDelete(null)}
        title="Delete this campaign?"
        description={`"${campaignToDelete?.name}" will be permanently removed. Coupons that reference it keep their own settings but lose the shared budget link.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCampaign.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
