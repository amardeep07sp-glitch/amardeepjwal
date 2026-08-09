import { Modal } from '@/components/global/Modal';
import { Badge } from '@/components/ui/badge';
import { JOURNAL_EVENT_TYPE_LABELS, JOURNAL_STATUS_BADGE_VARIANTS } from './accountingSchema';
import { useJournalById } from './journalsApi';

export function JournalDetailModal({ journalId, open, onOpenChange }) {
  const { data } = useJournalById(journalId);
  const journal = data?.journal;
  const lines = data?.lines ?? [];

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={journal?.journalNumber ?? 'Journal'} className="sm:max-w-lg">
      {!journal ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="outline">{JOURNAL_EVENT_TYPE_LABELS[journal.eventType] ?? journal.eventType}</Badge>
            <Badge variant={JOURNAL_STATUS_BADGE_VARIANTS[journal.status]} className="capitalize">{journal.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{journal.narration}</p>
          <p className="text-xs text-muted-foreground">{new Date(journal.date).toLocaleString()} · Posted by {journal.postedBy?.name ?? 'System'}</p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{line.account?.code} - {line.account?.name}</td>
                    <td className="px-3 py-2 text-right">{line.debit > 0 ? line.debit.toFixed(2) : ''}</td>
                    <td className="px-3 py-2 text-right">{line.credit > 0 ? line.credit.toFixed(2) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
