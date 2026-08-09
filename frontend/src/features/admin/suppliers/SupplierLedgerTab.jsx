import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/global/EmptyState';
import { Button } from '@/components/ui/button';
import { useSupplierLedger } from '../purchases/supplierLedgerApi';
import { SUPPLIER_LEDGER_TYPE_LABELS } from '../purchases/purchaseSchema';

export function SupplierLedgerTab({ supplierId }) {
  const [page, setPage] = useState(1);
  const { data } = useSupplierLedger(supplierId, { page, limit: 20 });
  const entries = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1 };

  if (entries.length === 0) {
    return <EmptyState title="No ledger entries yet" description="Every purchase, payment, and return posts an immutable entry here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Balance after</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="capitalize">{SUPPLIER_LEDGER_TYPE_LABELS[entry.type] ?? entry.type}</Badge>
                </td>
                <td className="px-3 py-2">{entry.reason || '—'}</td>
                <td className={`px-3 py-2 text-right font-medium ${entry.amount >= 0 ? 'text-warning' : 'text-success'}`}>
                  {entry.amount >= 0 ? '+' : ''}₹{entry.amount.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">₹{entry.balanceAfter.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
