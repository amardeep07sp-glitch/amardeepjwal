import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/global/Modal';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { downloadFile } from '@/lib/downloadFile';
import { useAuthStore } from '@/store/authStore';
import {
  useOrderById,
  useOrderTimeline,
  useSubmitOrder,
  useConfirmOrder,
  useCancelOrder,
  usePackOrder,
  useMarkReadyToShip,
  useCompleteOrder,
} from './ordersApi';
import { useOrderPayments } from './orderPaymentsApi';
import { useShipmentsForOrder, useMarkShipmentDelivered } from './orderShipmentsApi';
import { useReturnsForOrder, useApproveReturn, useRejectReturn, useSchedulePickup, useMarkReturnReceived, useMarkReturnInspected, useAcceptReturn, useRestockReturn } from './orderReturnsApi';
import { useRefundsForOrder, useProcessRefund, useFailRefund } from './orderRefundsApi';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_VARIANTS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_METHOD_LABELS,
  RETURN_STATUS_LABELS,
  RETURN_STATUS_BADGE_VARIANTS,
  REFUND_STATUS_BADGE_VARIANTS,
  SHIPMENT_STATUS_BADGE_VARIANTS,
  ORDER_TIMELINE_LABELS,
} from './orderSchema';
import { RecordPaymentModal } from './RecordPaymentModal';
import { CreateShipmentModal } from './CreateShipmentModal';
import { RequestReturnModal } from './RequestReturnModal';
import { CreateRefundModal } from './CreateRefundModal';

const RETURN_TRANSITIONS = {
  requested: [{ label: 'Approve', hook: 'approve' }, { label: 'Reject', hook: 'reject' }],
  approved: [{ label: 'Schedule Pickup', hook: 'schedulePickup' }],
  pickup_scheduled: [{ label: 'Mark Received', hook: 'receive' }],
  received: [{ label: 'Mark Inspected', hook: 'inspect' }],
  inspected: [{ label: 'Accept', hook: 'accept' }, { label: 'Reject', hook: 'reject' }],
  accepted: [{ label: 'Restock', hook: 'restock' }],
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const canCancelOrRefund = ['super_admin', 'admin', 'manager'].includes(role);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useOrderById(id);
  const { data: timeline } = useOrderTimeline(id);
  const { data: payments } = useOrderPayments(id);
  const { data: shipments } = useShipmentsForOrder(id);
  const { data: returns } = useReturnsForOrder(id);
  const { data: refunds } = useRefundsForOrder(id);

  const submitOrder = useSubmitOrder();
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const packOrder = usePackOrder();
  const markReadyToShip = useMarkReadyToShip();
  const completeOrder = useCompleteOrder();
  const markShipmentDelivered = useMarkShipmentDelivered();
  const processRefund = useProcessRefund();
  const failRefund = useFailRefund();

  const returnHooks = {
    approve: useApproveReturn(),
    reject: useRejectReturn(),
    schedulePickup: useSchedulePickup(),
    receive: useMarkReturnReceived(),
    inspect: useMarkReturnInspected(),
    accept: useAcceptReturn(),
    restock: useRestockReturn(),
  };

  if (isLoading) return <PageLoader label="Loading order..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const { order, items } = data;
  const paymentsList = payments ?? [];
  const shipmentsList = shipments ?? [];
  const returnsList = returns ?? [];
  const refundsList = refunds ?? [];

  const totalPaid = paymentsList.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = refundsList.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
  const maxRefundable = Math.max(totalPaid - totalRefunded, 0);

  const packableItems = items.filter((i) => i.status === 'pending');
  const shippableItems = items.filter((i) => i.status === 'packed');
  const returnableItems = items.filter((i) => i.status === 'delivered');

  const runAction = async (mutation, payload, successMessage) => {
    try {
      await mutation.mutateAsync(payload);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOrder.mutateAsync({ id, body: { reason: cancelReason } });
      toast.success('Order cancelled');
      setCancelOpen(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      await downloadFile(`/invoices/order/${id}/download`, { filename: `invoice-${order.orderNumber}.pdf` });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-h4 font-semibold text-heading">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {order.customer?.name ?? 'Unknown customer'} · {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]} className="capitalize">
            {ORDER_STATUS_LABELS[order.orderStatus]}
          </Badge>
          <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[order.paymentStatus]} className="capitalize">
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice}>
            <Download className="size-4" />
            Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.orderStatus === 'draft' && (
          <Button size="sm" onClick={() => runAction(submitOrder, { id }, 'Order submitted')}>
            Submit <ArrowRight className="size-4" />
          </Button>
        )}
        {order.orderStatus === 'pending' && (
          <Button size="sm" onClick={() => runAction(confirmOrder, { id }, 'Order confirmed')}>
            Confirm <ArrowRight className="size-4" />
          </Button>
        )}
        {order.orderStatus === 'confirmed' && (
          <Button size="sm" onClick={() => runAction(packOrder, { id }, 'Order packed')} disabled={packableItems.length === 0}>
            Pack <ArrowRight className="size-4" />
          </Button>
        )}
        {order.orderStatus === 'packed' && (
          <Button size="sm" onClick={() => runAction(markReadyToShip, { id }, 'Marked ready to ship')}>
            Ready to Ship <ArrowRight className="size-4" />
          </Button>
        )}
        {['packed', 'ready_to_ship', 'partially_shipped'].includes(order.orderStatus) && shippableItems.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShipmentModalOpen(true)}>
            Create Shipment
          </Button>
        )}
        {['delivered', 'partially_delivered'].includes(order.orderStatus) && (
          <Button size="sm" onClick={() => runAction(completeOrder, { id }, 'Order completed')}>
            Complete
          </Button>
        )}
        {['delivered', 'partially_delivered', 'completed'].includes(order.orderStatus) && returnableItems.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setReturnModalOpen(true)}>
            Request Return
          </Button>
        )}
        {['draft', 'pending', 'confirmed', 'packed', 'ready_to_ship'].includes(order.orderStatus) && canCancelOrRefund && (
          <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancel Order
          </Button>
        )}
        {['pending', 'partially_paid'].includes(order.paymentStatus) && (
          <Button size="sm" variant="outline" onClick={() => setPaymentModalOpen(true)}>
            Record Payment
          </Button>
        )}
        {maxRefundable > 0 && canCancelOrRefund && (
          <Button size="sm" variant="outline" onClick={() => setRefundModalOpen(true)}>
            Create Refund
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{order.currency} {order.subtotal.toFixed(2)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{order.discount.toFixed(2)}</span></div>}
            {order.couponDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Coupon</span><span>-{order.couponDiscount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shippingCharge.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Handling</span><span>{order.handlingCharge.toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-heading"><span>Grand Total</span><span>{order.currency} {order.grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Paid</span><span>{totalPaid.toFixed(2)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer & Addresses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p><span className="text-muted-foreground">Customer: </span>{order.customer?.name ?? '—'} {order.customer?.phone ? `(${order.customer.phone})` : ''}</p>
            {order.billingAddressSnapshot?.line1 && (
              <p><span className="text-muted-foreground">Billing: </span>{order.billingAddressSnapshot.line1}, {order.billingAddressSnapshot.city}</p>
            )}
            {order.shippingAddressSnapshot?.line1 && (
              <p><span className="text-muted-foreground">Shipping: </span>{order.shippingAddressSnapshot.line1}, {order.shippingAddressSnapshot.city}</p>
            )}
            <p><span className="text-muted-foreground">Warehouse: </span>{order.warehouse?.name ?? '—'}</p>
            <p><span className="text-muted-foreground">Source: </span><span className="capitalize">{order.source}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {order.notes || 'No notes.'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2">Product</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Unit Price</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2">{item.productSnapshot?.name ?? '—'}</td>
                    <td className="py-2">{item.sku}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2">{item.total.toFixed(2)}</td>
                    <td className="py-2 capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsList.length === 0 ? (
              <EmptyState title="No payments yet" description="Record a payment once received." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {paymentsList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span>{PAYMENT_METHOD_LABELS[p.method] ?? p.method} — {p.amount.toFixed(2)}</span>
                    <Badge variant={PAYMENT_STATUS_BADGE_VARIANTS[p.status]} className="capitalize">{p.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {shipmentsList.length === 0 ? (
              <EmptyState title="No shipments yet" description="Create one once items are packed." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {shipmentsList.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span>{s.shipmentNumber} — {s.courier || 'No courier'} {s.trackingNumber && `(${s.trackingNumber})`}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={SHIPMENT_STATUS_BADGE_VARIANTS[s.status]} className="capitalize">{s.status}</Badge>
                      {s.status !== 'delivered' && (
                        <Button size="sm" variant="outline" onClick={() => runAction(markShipmentDelivered, s.id, 'Shipment delivered')}>
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {returnsList.length === 0 ? (
              <EmptyState title="No returns" description="Return requests will appear here." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {returnsList.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{r.items.length} item(s) — {r.reason || 'No reason given'}</span>
                      <Badge variant={RETURN_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">
                        {RETURN_STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(RETURN_TRANSITIONS[r.status] ?? []).map(({ label, hook }) => (
                        <Button key={hook} size="sm" variant="outline" onClick={() => runAction(returnHooks[hook], r.id, `Return ${label.toLowerCase()}d`)}>
                          {label}
                        </Button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            {refundsList.length === 0 ? (
              <EmptyState title="No refunds" description="Refunds will appear here once created." />
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {refundsList.map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span>{r.type} — {r.amount.toFixed(2)} {r.method && `(${r.method})`}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={REFUND_STATUS_BADGE_VARIANTS[r.status]} className="capitalize">{r.status}</Badge>
                      {r.status === 'pending' && canCancelOrRefund && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => runAction(processRefund, { id: r.id }, 'Refund processed')}>
                            Process
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => runAction(failRefund, { id: r.id }, 'Refund marked failed')}>
                            Fail
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {!timeline || timeline.length === 0 ? (
            <EmptyState title="No events yet" description="Order milestones will appear here." />
          ) : (
            <ol className="flex flex-col gap-3">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ORDER_TIMELINE_LABELS[entry.event] ?? entry.event}</Badge>
                    {entry.note && <span className="text-sm text-muted-foreground">{entry.note}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.createdBy?.name ?? 'System'} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Modal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel order"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelOrder.isPending}>
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel order'}
            </Button>
          </>
        }
      >
        <Textarea placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
      </Modal>

      <RecordPaymentModal orderId={id} open={paymentModalOpen} onOpenChange={setPaymentModalOpen} suggestedAmount={order.grandTotal - totalPaid} />
      <CreateShipmentModal orderId={id} items={shippableItems} open={shipmentModalOpen} onOpenChange={setShipmentModalOpen} />
      <RequestReturnModal orderId={id} items={returnableItems} open={returnModalOpen} onOpenChange={setReturnModalOpen} />
      <CreateRefundModal orderId={id} maxRefundable={maxRefundable} open={refundModalOpen} onOpenChange={setRefundModalOpen} />
    </div>
  );
}
