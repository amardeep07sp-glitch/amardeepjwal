import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/global/Modal';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { useAuthStore } from '@/store/authStore';
import {
  usePurchaseOrderById,
  useSubmitForApproval,
  useApprovePurchaseOrder,
  useMarkOrdered,
  useCancelPurchaseOrder,
} from './purchaseOrdersApi';
import { useGrnsForPurchaseOrder } from './goodsReceiptNotesApi';
import { usePaymentsForPurchaseOrder } from './supplierPaymentsApi';
import { useReturnsForPurchaseOrder, useApprovePurchaseReturn, useRejectPurchaseReturn, useCompletePurchaseReturn } from './purchaseReturnsApi';
import {
  PO_STATUS_LABELS,
  PO_STATUS_BADGE_VARIANTS,
  PO_PAYMENT_STATUS_LABELS,
  PO_PAYMENT_STATUS_BADGE_VARIANTS,
  PURCHASE_PAYMENT_METHOD_LABELS,
  PURCHASE_RETURN_STATUS_LABELS,
  PURCHASE_RETURN_STATUS_BADGE_VARIANTS,
  PURCHASE_RETURN_ACTION_LABELS,
} from './purchaseSchema';
import { ReceiveGoodsModal } from './ReceiveGoodsModal';
import { RecordSupplierPaymentModal } from './RecordSupplierPaymentModal';
import { RequestPurchaseReturnModal } from './RequestPurchaseReturnModal';

const RETURN_TRANSITIONS = {
  requested: [{ label: 'Approve', hook: 'approve' }, { label: 'Reject', hook: 'reject' }],
  approved: [{ label: 'Complete', hook: 'complete' }],
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canApproveOrCancel = ['super_admin', 'admin', 'manager'].includes(role);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const { data, isLoading, error, refetch } = usePurchaseOrderById(id);
  const { data: grns } = useGrnsForPurchaseOrder(id);
  const { data: payments } = usePaymentsForPurchaseOrder(id);
  const { data: returns } = useReturnsForPurchaseOrder(id);

  const submitForApproval = useSubmitForApproval();
  const approvePurchaseOrder = useApprovePurchaseOrder();
  const markOrdered = useMarkOrdered();
  const cancelPurchaseOrder = useCancelPurchaseOrder();

  const returnHooks = {
    approve: useApprovePurchaseReturn(),
    reject: useRejectPurchaseReturn(),
    complete: useCompletePurchaseReturn(),
  };

  if (isLoading) return <PageLoader label="Loading purchase order..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const { purchaseOrder, items } = data;
  const grnsList = grns ?? [];
  const paymentsList = payments ?? [];
  const returnsList = returns ?? [];

  const totalPaid = paymentsList.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const runAction = async (mutation, payload, successMessage) => {
    try {
      await mutation.mutateAsync(payload);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const runReturnAction = async (hookKey, returnId, label) => {
    try {
      await returnHooks[hookKey].mutateAsync(returnId);
      toast.success(`Return ${label.toLowerCase()}d`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPurchaseOrder.mutateAsync({ id, body: { reason: cancelReason } });
      toast.success('Purchase order cancelled');
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/admin/purchase-orders')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-h4 font-semibold text-heading">{purchaseOrder.poNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {purchaseOrder.supplier?.name ?? 'Unknown supplier'} · {new Date(purchaseOrder.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PO_STATUS_BADGE_VARIANTS[purchaseOrder.status]} className="capitalize">
            {PO_STATUS_LABELS[purchaseOrder.status]}
          </Badge>
          <Badge variant={PO_PAYMENT_STATUS_BADGE_VARIANTS[purchaseOrder.paymentStatus]} className="capitalize">
            {PO_PAYMENT_STATUS_LABELS[purchaseOrder.paymentStatus]}
          </Badge>
          {purchaseOrder.supplier?.id && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/suppliers/${purchaseOrder.supplier.id}`)}>
              <Building2 className="size-4" /> View supplier
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {purchaseOrder.status === 'draft' && (
          <Button size="sm" onClick={() => runAction(submitForApproval, { id }, 'Submitted for approval')}>
            Submit for Approval <ArrowRight className="size-4" />
          </Button>
        )}
        {purchaseOrder.status === 'pending' && canApproveOrCancel && (
          <Button size="sm" onClick={() => runAction(approvePurchaseOrder, { id }, 'Purchase order approved')}>
            Approve <ArrowRight className="size-4" />
          </Button>
        )}
        {purchaseOrder.status === 'approved' && (
          <Button size="sm" onClick={() => runAction(markOrdered, { id }, 'Marked as ordered')}>
            Mark Ordered <ArrowRight className="size-4" />
          </Button>
        )}
        {['ordered', 'partially_received'].includes(purchaseOrder.status) && (
          <Button size="sm" variant="outline" onClick={() => setReceiveOpen(true)}>
            Receive Goods
          </Button>
        )}
        {['pending', 'partial'].includes(purchaseOrder.paymentStatus) && (
          <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
            Record Payment
          </Button>
        )}
        {['received', 'partially_received'].includes(purchaseOrder.status) && (
          <Button size="sm" variant="outline" onClick={() => setReturnOpen(true)}>
            Request Return
          </Button>
        )}
        {['draft', 'pending', 'approved', 'ordered', 'partially_received'].includes(purchaseOrder.status) && canApproveOrCancel && (
          <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{purchaseOrder.subtotal.toFixed(2)}</span></div>
            {purchaseOrder.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{purchaseOrder.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{purchaseOrder.tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{purchaseOrder.shippingCharge.toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-heading"><span>Grand Total</span><span>₹{purchaseOrder.grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Paid</span><span>{totalPaid.toFixed(2)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Supplier & Warehouse</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p><span className="text-muted-foreground">Supplier: </span>{purchaseOrder.supplier?.name ?? '—'} {purchaseOrder.supplier?.phone ? `(${purchaseOrder.supplier.phone})` : ''}</p>
            {purchaseOrder.supplierSnapshot?.gstNumber && (
              <p><span className="text-muted-foreground">GST at approval: </span>{purchaseOrder.supplierSnapshot.gstNumber}</p>
            )}
            <p><span className="text-muted-foreground">Warehouse: </span>{purchaseOrder.warehouse?.name ?? '—'}</p>
            <p><span className="text-muted-foreground">Expected delivery: </span>{purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{purchaseOrder.internalNotes || 'No notes.'}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2">Product</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Ordered</th>
                  <th className="py-2">Received</th>
                  <th className="py-2">Returned</th>
                  <th className="py-2">Pending</th>
                  <th className="py-2">Unit Cost</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2">{item.productSnapshot?.name ?? '—'}</td>
                    <td className="py-2">{item.sku}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{item.receivedQuantity}</td>
                    <td className="py-2">{item.returnedQuantity}</td>
                    <td className="py-2">{item.pendingQuantity}</td>
                    <td className="py-2">{item.unitCost.toFixed(2)}</td>
                    <td className="py-2">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Goods Receipt Notes</CardTitle></CardHeader>
          <CardContent>
            {grnsList.length === 0 ? (
              <EmptyState title="No goods received yet" description="Receive goods once the order is placed." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {grnsList.map((grn) => (
                  <li key={grn.id} className="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-heading">{grn.grnNumber}</span>
                      <span className="text-xs text-muted-foreground">{new Date(grn.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{grn.items.length} line(s) · Received by {grn.receivedBy?.name ?? 'System'}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent>
            {paymentsList.length === 0 ? (
              <EmptyState title="No payments yet" description="Record a payment once due." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {paymentsList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span>{PURCHASE_PAYMENT_METHOD_LABELS[p.method] ?? p.method} — ₹{p.amount.toFixed(2)}</span>
                    <Badge variant={p.status === 'paid' ? 'success' : 'secondary'} className="capitalize">{p.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
          <CardContent>
            {returnsList.length === 0 ? (
              <EmptyState title="No returns" description="Return requests will appear here." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {returnsList.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{r.returnNumber} · {r.items.length} item(s) · {PURCHASE_RETURN_ACTION_LABELS[r.action]} · ₹{r.amount.toFixed(2)}</span>
                      <Badge variant={PURCHASE_RETURN_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
                        {PURCHASE_RETURN_STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </div>
                    {r.reason && <span className="text-muted-foreground">{r.reason}</span>}
                    {canApproveOrCancel && (
                      <div className="flex flex-wrap gap-2">
                        {(RETURN_TRANSITIONS[r.status] ?? []).map(({ label, hook }) => (
                          <Button key={hook} size="sm" variant="outline" onClick={() => runReturnAction(hook, r.id, label)}>
                            {label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel purchase order"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelPurchaseOrder.isPending}>
              {cancelPurchaseOrder.isPending ? 'Cancelling...' : 'Cancel purchase order'}
            </Button>
          </>
        }
      >
        <Textarea placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
      </Modal>

      <ReceiveGoodsModal purchaseOrderId={id} items={items} open={receiveOpen} onOpenChange={setReceiveOpen} />
      <RecordSupplierPaymentModal
        supplierId={purchaseOrder.supplier?.id}
        purchaseOrderId={id}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        suggestedAmount={purchaseOrder.grandTotal - totalPaid}
      />
      <RequestPurchaseReturnModal purchaseOrderId={id} items={items} open={returnOpen} onOpenChange={setReturnOpen} />
    </div>
  );
}
