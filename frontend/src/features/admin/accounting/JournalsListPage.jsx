import { useState } from 'react';
import { Eye, Plus, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/global/DataTable';
import { Modal } from '@/components/global/Modal';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useJournals, useReverseJournal } from './journalsApi';
import { JOURNAL_EVENT_TYPE_LABELS, JOURNAL_STATUS_BADGE_VARIANTS } from './accountingSchema';
import { NewManualJournalModal } from './NewManualJournalModal';
import { JournalDetailModal } from './JournalDetailModal';

const EVENT_FILTER_ALL = 'all';

export default function JournalsListPage() {
  const [eventType, setEventType] = useState(EVENT_FILTER_ALL);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseReason, setReverseReason] = useState('');

  const { data, isLoading, error, refetch } = useJournals({
    page,
    limit: DEFAULT_PAGE_SIZE,
    eventType: eventType === EVENT_FILTER_ALL ? undefined : eventType,
  });
  const reverseJournal = useReverseJournal();

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const handleReverse = async () => {
    try {
      await reverseJournal.mutateAsync({ id: reverseTarget.id, reason: reverseReason });
      toast.success('Reversing journal posted');
      setReverseTarget(null);
      setReverseReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'journalNumber', header: 'Journal #' },
    { key: 'date', header: 'Date', render: (j) => new Date(j.date).toLocaleDateString() },
    { key: 'eventType', header: 'Event', render: (j) => <Badge variant="outline">{JOURNAL_EVENT_TYPE_LABELS[j.eventType] ?? j.eventType}</Badge> },
    { key: 'narration', header: 'Narration', render: (j) => <span className="line-clamp-1">{j.narration}</span> },
    { key: 'totalAmount', header: 'Amount', render: (j) => `₹${j.totalAmount.toFixed(2)}` },
    { key: 'status', header: 'Status', render: (j) => <Badge variant={JOURNAL_STATUS_BADGE_VARIANTS[j.status]} className="capitalize">{j.status}</Badge> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      render: (j) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="View" onClick={() => setDetailId(j.id)}>
            <Eye className="size-4" />
          </Button>
          {j.status === 'posted' && (
            <Button variant="ghost" size="icon-sm" aria-label="Reverse" onClick={() => setReverseTarget(j)}>
              <Undo2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Journals</h1>
          <p className="text-sm text-muted-foreground">Every double-entry posting - immutable, correction by reversal only.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> New manual journal
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(j) => j.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        toolbarActions={
          <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EVENT_FILTER_ALL}>All events</SelectItem>
              {Object.entries(JOURNAL_EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No journals yet"
        emptyDescription="Journals post automatically from Sales/Purchase/Wallet/Expense events, or manually here."
        pagination={{ page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems, pageSize: DEFAULT_PAGE_SIZE, onPageChange: setPage }}
      />

      <NewManualJournalModal open={createOpen} onOpenChange={setCreateOpen} />
      {detailId && <JournalDetailModal journalId={detailId} open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)} />}

      <Modal
        open={Boolean(reverseTarget)}
        onOpenChange={(open) => !open && setReverseTarget(null)}
        title="Reverse journal"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReverseTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReverse} disabled={reverseJournal.isPending}>
              {reverseJournal.isPending ? 'Reversing...' : 'Post reversal'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Posts a new journal with every line's debit/credit swapped - {reverseTarget?.journalNumber} itself is never edited.
        </p>
        <Textarea placeholder="Reason (optional)" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} rows={3} />
      </Modal>
    </div>
  );
}
