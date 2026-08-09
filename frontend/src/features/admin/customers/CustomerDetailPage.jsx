import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Download, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { EmptyState } from '@/components/global/EmptyState';
import { downloadFile } from '@/lib/downloadFile';
import { useCustomerById, useCustomerTimeline, useCustomerActivity } from './customersApi';
import { useOrders } from '../orders/ordersApi';
import { useSendNotification } from './customerNotificationsApi';
import { CustomerFormModal } from './CustomerFormModal';
import { AddressBookTab } from './AddressBookTab';
import { ContactsTab } from './ContactsTab';
import { NotesTab } from './NotesTab';
import { DocumentsTab } from './DocumentsTab';
import { WalletTab } from './WalletTab';
import { LoyaltyTab } from './LoyaltyTab';
import { ReferralsTab } from './ReferralsTab';
import { PreferencesTab } from './PreferencesTab';
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_BADGE_VARIANTS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TIMELINE_LABELS,
} from './customerSchema';
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_VARIANTS } from '../orders/orderSchema';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: customer, isLoading, error, refetch } = useCustomerById(id);
  const { data: timeline } = useCustomerTimeline(id);
  const { data: activity } = useCustomerActivity(id);
  const { data: ordersData } = useOrders({ customer: id, limit: 20 });
  const sendNotification = useSendNotification();

  if (isLoading) return <PageLoader label="Loading customer..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const orders = ordersData?.items ?? [];

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    try {
      await sendNotification.mutateAsync({ customerId: id, subject: subject.trim(), message: message.trim() });
      toast.success('Notification sent');
      setSendOpen(false);
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatement = async () => {
    try {
      await downloadFile(`/customers/${id}/statement`, { filename: `statement-${customer.customerCode}.pdf` });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-h4 font-semibold text-heading">{customer.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.customerCode} · {[customer.phone, customer.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={CUSTOMER_STATUS_BADGE_VARIANTS[customer.status]} className="capitalize">
            {CUSTOMER_STATUS_LABELS[customer.status]}
          </Badge>
          <Badge variant="outline" className="capitalize">{CUSTOMER_TYPE_LABELS[customer.customerType]}</Badge>
          <Button variant="outline" size="sm" onClick={() => setSendOpen(true)}>
            <Send className="size-4" /> Message
          </Button>
          <Button variant="outline" size="sm" onClick={handleStatement}>
            <Download className="size-4" /> Statement
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex-wrap">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-4">
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders placed by this customer will appear here." />
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
                  onClick={() => navigate(`/admin/orders/${o.id}`)}
                >
                  <span>{o.orderNumber} · {new Date(o.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <span>{o.currency} {o.grandTotal.toFixed(2)}</span>
                    <Badge variant={ORDER_STATUS_BADGE_VARIANTS[o.orderStatus]} className="capitalize">
                      {ORDER_STATUS_LABELS[o.orderStatus]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="pt-4">
          <AddressBookTab customerId={id} />
        </TabsContent>
        <TabsContent value="contacts" className="pt-4">
          <ContactsTab customerId={id} />
        </TabsContent>
        <TabsContent value="notes" className="pt-4">
          <NotesTab customerId={id} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <DocumentsTab customerId={id} />
        </TabsContent>
        <TabsContent value="wallet" className="pt-4">
          <WalletTab customerId={id} />
        </TabsContent>
        <TabsContent value="loyalty" className="pt-4">
          <LoyaltyTab customerId={id} />
        </TabsContent>
        <TabsContent value="referrals" className="pt-4">
          <ReferralsTab customer={customer} />
        </TabsContent>
        <TabsContent value="preferences" className="pt-4">
          <PreferencesTab customerId={id} />
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          {!timeline || timeline.length === 0 ? (
            <EmptyState title="No events yet" description="Customer milestones will appear here." />
          ) : (
            <ol className="flex flex-col gap-3">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{CUSTOMER_TIMELINE_LABELS[entry.event] ?? entry.event}</Badge>
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

      <CustomerFormModal open={editOpen} onOpenChange={setEditOpen} customer={customer} />

      <Modal
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Send message"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sendNotification.isPending}>
              {sendNotification.isPending ? 'Sending...' : 'Send'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Subject" required>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormField>
          <FormField label="Message" required description="Sent via email and WhatsApp, whichever contact details are on file">
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
