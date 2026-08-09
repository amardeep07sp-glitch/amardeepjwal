import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { useSupplierById, useSupplierTimeline, useSupplierActivity } from './suppliersApi';
import { SupplierFormModal } from './SupplierFormModal';
import { SupplierPurchaseOrdersTab } from './SupplierPurchaseOrdersTab';
import { SupplierAddressBookTab } from './SupplierAddressBookTab';
import { SupplierContactsTab } from './SupplierContactsTab';
import { SupplierNotesTab } from './SupplierNotesTab';
import { SupplierDocumentsTab } from './SupplierDocumentsTab';
import { SupplierLedgerTab } from './SupplierLedgerTab';
import { SUPPLIER_STATUS_LABELS, SUPPLIER_STATUS_BADGE_VARIANTS, SUPPLIER_TIMELINE_LABELS } from './supplierSchema';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: supplier, isLoading, error, refetch } = useSupplierById(id);
  const { data: timeline } = useSupplierTimeline(id);
  const { data: activity } = useSupplierActivity(id);

  if (isLoading) return <PageLoader label="Loading supplier..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/admin/suppliers')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-h4 font-semibold text-heading">{supplier.name}</h1>
            <p className="text-sm text-muted-foreground">
              {supplier.supplierCode} · {[supplier.phone, supplier.email].filter(Boolean).join(' · ') || 'No contact on file'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={SUPPLIER_STATUS_BADGE_VARIANTS[supplier.status]} className="capitalize">
            {SUPPLIER_STATUS_LABELS[supplier.status]}
          </Badge>
          <Badge variant={supplier.outstandingBalance > 0 ? 'warning' : 'secondary'}>
            Outstanding: ₹{supplier.outstandingBalance.toFixed(2)}
          </Badge>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="purchase-orders">
        <TabsList className="flex-wrap">
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase-orders" className="pt-4">
          <SupplierPurchaseOrdersTab supplierId={id} />
        </TabsContent>
        <TabsContent value="addresses" className="pt-4">
          <SupplierAddressBookTab supplierId={id} />
        </TabsContent>
        <TabsContent value="contacts" className="pt-4">
          <SupplierContactsTab supplierId={id} />
        </TabsContent>
        <TabsContent value="notes" className="pt-4">
          <SupplierNotesTab supplierId={id} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <SupplierDocumentsTab supplierId={id} />
        </TabsContent>
        <TabsContent value="ledger" className="pt-4">
          <SupplierLedgerTab supplierId={id} />
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          {!timeline || timeline.length === 0 ? (
            <EmptyState title="No events yet" description="Supplier milestones will appear here." />
          ) : (
            <ol className="flex flex-col gap-3">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{SUPPLIER_TIMELINE_LABELS[entry.event] ?? entry.event}</Badge>
                    {entry.note && <span className="text-sm text-muted-foreground">{entry.note}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.createdBy?.name ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          {!activity || activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Internal audit entries will appear here." />
          ) : (
            <ol className="flex flex-col gap-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3 text-sm">
                  <span className="font-medium text-heading">{entry.action}</span>
                  {entry.reason && <span className="text-muted-foreground">{entry.reason}</span>}
                  <p className="text-xs text-muted-foreground">
                    {entry.performedBy?.name ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <SupplierFormModal open={editOpen} onOpenChange={setEditOpen} supplier={supplier} />
    </div>
  );
}
