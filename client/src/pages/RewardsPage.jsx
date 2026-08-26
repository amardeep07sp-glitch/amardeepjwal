import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Copy, Gift, Share2, Wallet } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useMyWallet,
  useMyWalletLedger,
  useMyLoyalty,
  useMyLoyaltyLedger,
  useMyReferrals,
} from '@/features/storefront/storefrontApi';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

// Real thresholds (customer.constants.js#LOYALTY_TIER_THRESHOLDS) - mirrored
// here only for the progress bar's display math, never to decide a tier
// itself (that's always whatever the server already computed and returned).
const TIER_THRESHOLDS = [
  { tier: 'silver', minPoints: 0 },
  { tier: 'gold', minPoints: 5000 },
  { tier: 'platinum', minPoints: 10000 },
  { tier: 'diamond', minPoints: 20000 },
];
const TIER_STYLE = {
  silver: 'bg-slate-100 text-slate-600',
  gold: 'bg-amber-100 text-amber-700',
  platinum: 'bg-indigo-100 text-indigo-700',
  diamond: 'bg-cyan-100 text-cyan-700',
};

const WALLET_TXN_LABEL = { credit: 'Credit', debit: 'Debit', refund: 'Refund', adjustment: 'Adjustment' };
const LOYALTY_TXN_LABEL = { earn: 'Earned', redeem: 'Redeemed', expire: 'Expired', adjust: 'Adjusted' };
const REFERRAL_STATUS_STYLE = { pending: 'bg-warning/10 text-warning', completed: 'bg-info/10 text-info', rewarded: 'bg-success/10 text-success' };

function nextTierInfo(lifetimePoints, currentTier) {
  const currentIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === currentTier);
  const next = TIER_THRESHOLDS[currentIndex + 1];
  if (!next) return null;
  const prevMin = TIER_THRESHOLDS[currentIndex]?.minPoints ?? 0;
  const progress = Math.min(100, Math.round(((lifetimePoints - prevMin) / (next.minPoints - prevMin)) * 100));
  return { nextTier: next.tier, pointsNeeded: next.minPoints - lifetimePoints, progress };
}

export default function RewardsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [copied, setCopied] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useMyWallet();
  const { data: walletLedger, isLoading: walletLedgerLoading } = useMyWalletLedger({ limit: 10 });
  const { data: loyalty, isLoading: loyaltyLoading } = useMyLoyalty();
  const { data: loyaltyLedger, isLoading: loyaltyLedgerLoading } = useMyLoyaltyLedger({ limit: 10 });
  const { data: referralData, isLoading: referralsLoading } = useMyReferrals();

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const tierProgress = loyalty ? nextTierInfo(loyalty.lifetimePointsEarned, loyalty.currentTier) : null;

  const handleCopyCode = () => {
    if (!referralData?.referralCode) return;
    navigator.clipboard.writeText(referralData.referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <AccountLayout title="My Rewards" subtitle="Your wallet balance, loyalty points, and referrals" icon={Gift} breadcrumbLabel="My Rewards">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
              <Wallet className="size-4 text-primary" /> Wallet Balance
            </h2>
            {walletLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-3xl font-bold text-heading">{formatPrice(wallet?.balance ?? 0)}</p>
            )}
          </div>

          <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
              <Award className="size-4 text-primary" /> Loyalty Points
            </h2>
            {loyaltyLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-heading">{loyalty?.currentPoints ?? 0}</p>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold uppercase', TIER_STYLE[loyalty?.currentTier])}>
                    {loyalty?.currentTier}
                  </span>
                </div>
                {tierProgress && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tierProgress.progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {tierProgress.pointsNeeded} points to reach {tierProgress.nextTier} tier
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
            <Share2 className="size-4 text-primary" /> Refer & Earn
          </h2>
          {referralsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Share your code - when a friend shops with us, you both benefit.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-lg bg-secondary px-4 py-2.5 font-mono text-sm font-semibold tracking-wider text-heading">
                  {referralData?.referralCode}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={handleCopyCode}>
                  <Copy className="size-3.5" /> {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {referralData?.referrals?.length > 0 && (
                <div className="mt-4 divide-y divide-border border-t border-border">
                  {referralData.referrals.map((ref) => (
                    <div key={ref.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-sm text-heading">{ref.referredCustomer?.name ?? 'A friend'}</span>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold uppercase', REFERRAL_STATUS_STYLE[ref.status])}>
                        {ref.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-heading uppercase">Wallet History</h2>
            {walletLedgerLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !walletLedger?.items.length ? (
              <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {walletLedger.items.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-heading">{entry.reason || WALLET_TXN_LABEL[entry.type]}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={cn('shrink-0 font-semibold', ['credit', 'refund'].includes(entry.type) ? 'text-success' : 'text-destructive')}>
                      {['credit', 'refund'].includes(entry.type) ? '+' : '-'}
                      {formatPrice(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-heading uppercase">Points History</h2>
            {loyaltyLedgerLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !loyaltyLedger?.items.length ? (
              <p className="text-sm text-muted-foreground">No points activity yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {loyaltyLedger.items.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-heading">{entry.reason || LOYALTY_TXN_LABEL[entry.type]}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={cn('shrink-0 font-semibold', ['earn'].includes(entry.type) ? 'text-success' : 'text-destructive')}>
                      {['earn'].includes(entry.type) ? '+' : '-'}
                      {Math.abs(entry.points)} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
