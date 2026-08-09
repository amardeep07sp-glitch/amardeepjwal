import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/global/EmptyState';
import { useSegmentCounts, useSegmentMembers, useRecomputeSegments } from './cipApi';

const SEGMENT_LABELS = {
  new_customer: 'New Customer',
  returning: 'Returning',
  vip: 'VIP',
  high_value: 'High Value',
  inactive: 'Inactive',
  frequent_buyer: 'Frequent Buyer',
  cart_abandoner: 'Cart Abandoner',
  window_shopper: 'Window Shopper',
};

export default function CipSegmentsPage() {
  const [activeSegment, setActiveSegment] = useState(null);
  const { data: counts, isLoading } = useSegmentCounts();
  const { data: members } = useSegmentMembers(activeSegment, { page: 1, limit: 50 });
  const recompute = useRecomputeSegments();

  const handleRecompute = async () => {
    try {
      const result = await recompute.mutateAsync();
      toast.success(`Segments recomputed - ${result.data.customersProcessed} customers processed`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const countMap = Object.fromEntries((counts ?? []).map((c) => [c._id, c.count]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Customer Segmentation</h1>
          <p className="text-sm text-muted-foreground">Auto-generated intelligence - never written back onto the CRM's own segments.</p>
        </div>
        <Button onClick={handleRecompute} disabled={recompute.isPending}>
          <RefreshCw className={recompute.isPending ? 'animate-spin' : ''} /> {recompute.isPending ? 'Recomputing...' : 'Recompute now'}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveSegment(key)} className="text-left">
              <Card size="sm" className={activeSegment === key ? 'ring-2 ring-primary' : ''}>
                <CardContent className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold text-heading">{countMap[key] ?? 0}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {activeSegment && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-heading">{SEGMENT_LABELS[activeSegment]} customers</p>
              <Badge variant="outline">{members?.meta?.totalItems ?? 0} total</Badge>
            </div>
            {!members?.items || members.items.length === 0 ? (
              <EmptyState title="No customers in this segment yet" description="Run a recompute after there's some order/browsing activity." />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">All Segments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.items.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{row.customer?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.customer?.customerCode}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {row.segments.map((s) => (
                              <Badge key={s} variant="secondary">{SEGMENT_LABELS[s] ?? s}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
