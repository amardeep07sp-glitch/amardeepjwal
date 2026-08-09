import { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/global/EmptyState';
import { useReferralsForReferrer, useCompleteReferral, useRewardReferral } from './customerReferralsApi';
import { REFERRAL_STATUS_LABELS, REFERRAL_STATUS_BADGE_VARIANTS } from './customerSchema';

export function ReferralsTab({ customer }) {
  const [rewardPoints, setRewardPoints] = useState({});
  const { data: referrals } = useReferralsForReferrer(customer.id);
  const completeReferral = useCompleteReferral();
  const rewardReferral = useRewardReferral();

  const copyCode = () => {
    navigator.clipboard.writeText(customer.referralCode);
    toast.success('Referral code copied');
  };

  const handleComplete = async (id) => {
    try {
      await completeReferral.mutateAsync(id);
      toast.success('Referral marked completed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReward = async (id) => {
    const points = Number(rewardPoints[id]);
    if (!points || points <= 0) {
      toast.error('Enter a valid reward points value');
      return;
    }
    try {
      await rewardReferral.mutateAsync({ id, rewardPoints: points });
      toast.success('Referral rewarded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm text-muted-foreground">Referral code</p>
          <p className="text-lg font-semibold text-heading">{customer.referralCode}</p>
        </div>
        <Button variant="outline" onClick={copyCode}>
          <Copy className="size-4" /> Copy
        </Button>
      </div>

      {!referrals || referrals.length === 0 ? (
        <EmptyState title="No referrals yet" description="Customers this person referred will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-heading">{r.referredCustomer?.name}</span>
                <span className="text-muted-foreground"> ({r.referredCustomer?.customerCode})</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={REFERRAL_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
                  {REFERRAL_STATUS_LABELS[r.status] ?? r.status}
                </Badge>
                {r.status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => handleComplete(r.id)}>Mark completed</Button>
                )}
                {r.status === 'completed' && (
                  <>
                    <Input
                      type="number"
                      className="w-20"
                      placeholder="Points"
                      value={rewardPoints[r.id] ?? ''}
                      onChange={(e) => setRewardPoints((p) => ({ ...p, [r.id]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => handleReward(r.id)}>Reward</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
