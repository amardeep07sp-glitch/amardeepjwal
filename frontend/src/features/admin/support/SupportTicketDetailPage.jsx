import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Paperclip, Send, UserPlus, UserMinus, Lock, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { useAuthStore } from '@/store/authStore';
import { useTicket, useAssignTicket, useUpdateTicketPriority, useUpdateTicketStatus, useAddAgentMessage } from './supportApi';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUS_TRANSITIONS, TICKET_STATUS_LABELS, TICKET_STATUS_VARIANTS, PRIORITY_BADGE_VARIANTS } from './supportSchema';

const categoryLabel = (value) => TICKET_CATEGORIES.find((c) => c.value === value)?.label ?? value;
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CONTEXT_LABELS = { orderId: 'Order', productId: 'Product', paymentId: 'Payment', returnId: 'Return', refundId: 'Refund', couponId: 'Coupon' };

function ContextPanel({ context }) {
  const entries = Object.entries(context ?? {}).filter(([key, value]) => CONTEXT_LABELS[key] && value);
  const extraEntries = Object.entries(context?.extra ?? {});
  if (entries.length === 0 && extraEntries.length === 0) return <p className="text-sm text-muted-foreground">No linked context.</p>;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-2">
          <span className="text-muted-foreground">{CONTEXT_LABELS[key]}</span>
          <span className="truncate font-mono text-xs text-heading">{typeof value === 'object' ? value.id : value}</span>
        </div>
      ))}
      {extraEntries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-2">
          <span className="text-muted-foreground capitalize">{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
          <span className="truncate text-xs text-heading">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.type === 'system_event') {
    return <p className="py-1 text-center text-xs text-muted-foreground">{message.content}</p>;
  }

  const isAgent = message.senderRole === 'agent';
  const isInternal = message.type === 'internal_note';

  return (
    <div className={`flex flex-col gap-1 ${isAgent ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isInternal ? 'bg-warning/10 text-heading ring-1 ring-warning/30' : isAgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-heading'
        }`}
      >
        {isInternal && (
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-warning">
            <Lock className="size-3" /> Internal note
          </span>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.attachments?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="text-xs underline opacity-90">
                Attachment
              </a>
            ))}
          </div>
        )}
      </div>
      <span className="px-1 text-xs text-muted-foreground">
        {message.sender?.name ?? 'System'} · {formatDate(message.createdAt)}
      </span>
    </div>
  );
}

export default function SupportTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useTicket(id);
  const assignTicket = useAssignTicket();
  const updatePriority = useUpdateTicketPriority();
  const updateStatus = useUpdateTicketStatus();
  const addMessage = useAddAgentMessage();

  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  if (isLoading) return <PageLoader label="Loading ticket..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  const { ticket, messages } = data;

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    const formData = new FormData();
    formData.append('content', replyContent.trim());
    formData.append('type', isInternalNote ? 'internal_note' : 'message');
    files.forEach((file) => formData.append('attachments', file));

    try {
      await addMessage.mutateAsync({ id: ticket.id, formData });
      setReplyContent('');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(isInternalNote ? 'Internal note added' : 'Reply sent');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await assignTicket.mutateAsync({ id: ticket.id, agentUserId: currentUser.id });
      toast.success('Ticket assigned to you');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnassign = async () => {
    try {
      await assignTicket.mutateAsync({ id: ticket.id, agentUserId: null });
      toast.success('Ticket unassigned');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus.mutateAsync({ id: ticket.id, status });
      toast.success('Ticket status updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await updatePriority.mutateAsync({ id: ticket.id, priority });
      toast.success('Ticket priority updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const availableStatuses = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];
  const isMine = ticket.assignedAgent?.id === currentUser?.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate('/admin/support/tickets')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-h4 font-semibold text-heading">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <Badge variant={TICKET_STATUS_VARIANTS[ticket.status]} className="capitalize">
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">{ticket.subject}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Textarea
              rows={3}
              placeholder={isInternalNote ? 'Internal note (staff-only, never shown to the customer)...' : 'Reply to the customer...'}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <Paperclip className="size-3.5" /> {files.length > 0 ? `${files.length} file(s)` : 'Attach'}
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch checked={isInternalNote} onCheckedChange={setIsInternalNote} />
                  Internal note
                </label>
              </div>
              <Button size="sm" onClick={handleSendReply} disabled={addMessage.isPending || !replyContent.trim()}>
                <Send className="size-3.5" /> {addMessage.isPending ? 'Sending...' : isInternalNote ? 'Add note' : 'Send reply'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h3 className="mb-3 text-sm font-semibold text-heading">Customer</h3>
            <p className="text-sm font-medium text-heading">{ticket.customer?.name}</p>
            <p className="text-xs text-muted-foreground">{ticket.customer?.phone}</p>
            <p className="text-xs text-muted-foreground">{ticket.customer?.email}</p>
            {ticket.customer?.customerCode && <p className="mt-1 text-xs text-muted-foreground">Code: {ticket.customer.customerCode}</p>}
          </div>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h3 className="mb-3 text-sm font-semibold text-heading">Ticket details</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="text-heading">{categoryLabel(ticket.category)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <Badge variant={PRIORITY_BADGE_VARIANTS[p.value]} className="capitalize">
                          {p.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {availableStatuses.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Move to</span>
                  <Select value="" onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 w-32 text-xs">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {TICKET_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned to</span>
                <span className="text-heading">{ticket.assignedAgent?.name ?? 'Unassigned'}</span>
              </div>
              {!isMine ? (
                <Button variant="outline" size="sm" onClick={handleAssignToMe} disabled={assignTicket.isPending}>
                  <UserPlus className="size-3.5" /> Assign to me
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleUnassign} disabled={assignTicket.isPending}>
                  <UserMinus className="size-3.5" /> Unassign
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h3 className="mb-3 text-sm font-semibold text-heading">Linked context</h3>
            <ContextPanel context={ticket.context} />
          </div>
        </div>
      </div>
    </div>
  );
}
