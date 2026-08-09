import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Package, Pencil, Phone, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyProfile, useUpdateMyProfile, useMyAddresses, useMyOrders } from '@/features/storefront/storefrontApi';
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

const STATUS_STYLE = {
  confirmed: 'bg-primary/10 text-primary',
  shipped: 'bg-info/10 text-info',
  partially_shipped: 'bg-info/10 text-info',
  packed: 'bg-info/10 text-info',
  ready_to_ship: 'bg-info/10 text-info',
  delivered: 'bg-success/10 text-success',
  partially_delivered: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
};
const humanize = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Every field here is a real, saved column - name/phone on the auth User,
// dateOfBirth/gender on the linked CRM Customer (storefront.service.js#
// getMyProfile/updateMyProfile). Email has no self-service edit here since
// there's no verification flow behind it yet - showing it as editable
// would be a UI promise this backend can't keep.
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
  const { data: recentOrders, isLoading: ordersLoading } = useMyOrders({ limit: 3 });
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

  const defaultAddress = addresses?.find((a) => a.isDefaultShipping) ?? addresses?.[0];

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
    <AccountLayout title="My Profile" subtitle="Manage your personal information and preferences" icon={User} breadcrumbLabel="My Profile">
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-heading uppercase">Profile Information</h2>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="size-3.5" /> Edit Profile
              </Button>
            )}
          </div>

          {profileLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary ring-1 ring-primary/20">
                {(profile?.name ?? user.name).charAt(0).toUpperCase()}
              </span>

              {isEditing ? (
                <form onSubmit={handleSave} className="flex min-w-0 flex-1 flex-col gap-4">
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
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium text-heading">{profile?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="text-sm font-medium text-heading">{profile?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile Number</p>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-heading">
                      <Phone className="size-3.5 text-primary" /> {profile?.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium text-heading">
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
              <MapPin className="size-4 text-primary" /> My Addresses
            </h2>
            <Link to="/addresses" className="text-sm font-medium text-primary hover:text-primary-hover">
              View All
            </Link>
          </div>

          {addressesLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : defaultAddress ? (
            <div className="rounded-xl p-4 ring-1 ring-border">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-heading">{defaultAddress.label || 'Address'}</span>
                {defaultAddress.isDefaultShipping && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">Default</span>
                )}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                {defaultAddress.line1}
                {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}, {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Phone: {defaultAddress.phone}</p>
            </div>
          ) : (
            <Link
              to="/addresses"
              className="flex flex-col items-center justify-center gap-2 rounded-xl p-6 text-sm text-muted-foreground ring-1 ring-dashed ring-border hover:text-primary"
            >
              <MapPin className="size-5" /> Add your first address
            </Link>
          )}
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
              <Package className="size-4 text-primary" /> Recent Orders
            </h2>
            <Link to="/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
              View All Orders
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders?.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders?.items.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-heading">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {formatPrice(order.grandTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${STATUS_STYLE[order.orderStatus] ?? 'bg-muted text-muted-foreground'}`}>
                      {humanize(order.orderStatus)}
                    </span>
                    <Link to={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:text-primary-hover">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
