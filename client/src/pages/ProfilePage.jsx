import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Gift, LifeBuoy, Mail, MapPin, MessageCircle, Package, Pencil, Phone, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  useMyProfile,
  useUpdateMyProfile,
  useMyAddresses,
  useMyOrders,
  useMyWishlist,
  useMyWallet,
} from '@/features/storefront/storefrontApi';
import { AccountLayout } from '@/components/account/AccountLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';

const GENDER_OPTIONS = [
  { value: 'unspecified', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

function StatTile({ label, value, isLoading }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      {isLoading ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold text-heading">{value}</p>}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function NavRow({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-heading">{title}</span>
        {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SectionCard({ label, children }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="flex flex-col divide-y divide-border rounded-2xl bg-card ring-1 ring-border">{children}</div>
    </div>
  );
}

// A real navigation hub (matches how Myntra's own Profile tab works) - a
// stat row + grouped links out to the pages that actually hold the detail
// (Orders, Addresses, Wallet, Rewards), not a second copy of that content
// embedded inline. AccountLayout's own mobile pill-nav is redundant here
// since this page already links to every one of those destinations itself.
export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const patchUser = useAuthStore((s) => s.patchUser);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', dateOfBirth: '', gender: 'unspecified' });
  const [formError, setFormError] = useState('');

  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: addresses, isLoading: addressesLoading } = useMyAddresses();
  const { data: orders, isLoading: ordersLoading } = useMyOrders({ limit: 1 });
  const { data: wishlist, isLoading: wishlistLoading } = useMyWishlist({ enabled: Boolean(user) });
  const { data: wallet, isLoading: walletLoading } = useMyWallet();
  const updateProfile = useUpdateMyProfile();

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
        gender: profile.gender ?? 'unspecified',
      });
    }
  }, [profile]);

  if (isInitializing || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const result = await updateProfile.mutateAsync({
        name: form.name,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
      });
      patchUser({ name: result.name, phone: result.phone });
      setIsEditing(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <AccountLayout title="My Profile" subtitle="Manage your account and orders" icon={User} breadcrumbLabel="My Profile" hideMobileNav>
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-1 ring-primary/20">
                {(profile?.name ?? user.name).charAt(0).toUpperCase()}
              </span>
              {profileLoading ? (
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-heading">{profile?.name}</p>
                  {profile?.email && (
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Mail className="size-3 shrink-0" /> {profile.email}
                    </p>
                  )}
                  {profile?.phone && (
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Phone className="size-3 shrink-0" /> {profile.phone}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setIsEditing(true)}>
                <Pencil className="size-3.5" /> Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="mb-1.5">Full Name</Label>
                  <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="phone" className="mb-1.5">Mobile Number</Label>
                  <Input id="phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="dob" className="mb-1.5">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="mb-1.5">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger id="gender" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && <p className="text-sm text-destructive">{formError}</p>}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="luxury" loading={updateProfile.isPending}>
                  Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-4 divide-x divide-border border-t border-border pt-1">
              <StatTile label="Orders" value={orders?.meta.totalItems ?? 0} isLoading={ordersLoading} />
              <StatTile label="Wishlist" value={wishlist?.length ?? 0} isLoading={wishlistLoading} />
              <StatTile label="Addresses" value={addresses?.length ?? 0} isLoading={addressesLoading} />
              <StatTile label="Wallet" value={formatPrice(wallet?.balance ?? 0)} isLoading={walletLoading} />
            </div>
          )}
        </div>

        <SectionCard label="My Orders">
          <NavRow to="/orders" icon={Package} title="My Orders" description="Track, return, or buy items again" />
        </SectionCard>

        <SectionCard label="My Account">
          <NavRow to="/addresses" icon={MapPin} title="My Addresses" description="Add or manage delivery addresses" />
          <NavRow to="/rewards" icon={Gift} title="My Rewards" description="Wallet balance, loyalty points, and referrals" />
        </SectionCard>

        <SectionCard label="Support & More">
          <NavRow to="/contact" icon={MessageCircle} title="Contact Us" description="We're here to help" />
          <NavRow to="/faqs" icon={LifeBuoy} title="FAQs" description="Find answers to common questions" />
        </SectionCard>
      </div>
    </AccountLayout>
  );
}
