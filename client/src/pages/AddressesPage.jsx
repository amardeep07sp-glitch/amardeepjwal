import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyAddresses, useDeleteAddress } from '@/features/storefront/storefrontApi';
import { AccountLayout } from '@/components/account/AccountLayout';
import { AddressForm } from '@/components/checkout/AddressForm';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function AddressCard({ address, onEdit, onDeleteRequest }) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-heading">{address.label || 'Address'}</span>
          {address.isDefaultShipping && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">Default</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(address)} aria-label="Edit address" className="text-muted-foreground transition-colors hover:text-primary">
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(address)}
            aria-label="Delete address"
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Phone: {address.phone}</p>
    </div>
  );
}

export default function AddressesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [formState, setFormState] = useState({ open: false, address: null });
  const [addressToDelete, setAddressToDelete] = useState(null);

  const { data: addresses, isLoading, isError, error, refetch } = useMyAddresses();
  const deleteAddress = useDeleteAddress();

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const handleDeleteConfirm = async () => {
    await deleteAddress.mutateAsync(addressToDelete.id);
    setAddressToDelete(null);
  };

  return (
    <AccountLayout
      title="My Addresses"
      subtitle="Manage your saved delivery addresses"
      icon={MapPin}
      breadcrumbLabel="My Addresses"
      headerExtra={
        !formState.open && (
          <Button onClick={() => setFormState({ open: true, address: null })}>
            <Plus className="size-4" /> Add New Address
          </Button>
        )
      }
    >
      {formState.open && (
        <div className="mb-6">
          <AddressForm
            address={formState.address}
            onCancel={() => setFormState({ open: false, address: null })}
            onSuccess={() => setFormState({ open: false, address: null })}
          />
        </div>
      )}

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 && !formState.open ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a delivery address to check out faster next time."
          actionLabel="Add Address"
          onAction={() => setFormState({ open: true, address: null })}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={(addr) => setFormState({ open: true, address: addr })}
              onDeleteRequest={setAddressToDelete}
            />
          ))}
        </div>
      )}

      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAddressToDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-heading">Delete this address?</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              "{addressToDelete.label || addressToDelete.line1}" will be permanently removed.
            </p>
            {deleteAddress.isError && <p className="mt-2 text-sm text-destructive">{deleteAddress.error.message}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddressToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" loading={deleteAddress.isPending} onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
