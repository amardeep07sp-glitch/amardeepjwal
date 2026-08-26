import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LifeBuoy, Paperclip, Send } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyTicket, useReplyToMyTicket } from '@/features/support/supportApi';
import { compressImage } from '@/lib/compressImage';
import { AccountLayout } from '@/components/account/AccountLayout';
import { ErrorState } from '@/components/global/ErrorState';
import { Spinner } from '@/components/global/Loading';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_STYLE = {
  open: 'bg-info/10 text-info',
  in_progress: 'bg-warning/10 text-warning',
  waiting_for_customer: 'bg-muted text-muted-foreground',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function MessageBubble({ message }) {
  if (message.type === 'system_event') {
    return <p className="py-1 text-center text-xs text-muted-foreground">{message.content}</p>;
  }

  const isMe = message.senderRole === 'customer';
  return (
    <div className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
      <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm', isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-heading')}>
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
      <span className="px-1 text-xs text-muted-foreground">{isMe ? 'You' : 'Support team'} · {formatDate(message.createdAt)}</span>
    </div>
  );
}

export default function SupportTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data, isLoading, isError, error, refetch } = useMyTicket(id);
  const replyToTicket = useReplyToMyTicket();

  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  const handleReply = async () => {
    if (!content.trim()) return;
    setReplyError('');
    const formData = new FormData();
    formData.append('content', content.trim());
    const compressedFiles = await Promise.all(files.map(compressImage));
    compressedFiles.forEach((file) => formData.append('attachments', file));

    try {
      await replyToTicket.mutateAsync({ id, payload: formData });
      setContent('');
      setFiles([]);
    } catch (err) {
      setReplyError(err.message);
    }
  };

  return (
    <AccountLayout title="Support Ticket" icon={LifeBuoy} breadcrumbLabel="Support">
      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <Spinner className="mx-auto mt-10" />
      ) : (
        (() => {
          const { ticket, messages } = data;
          const isClosed = ticket.status === 'closed';
          return (
            <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                  <p className="text-sm font-semibold text-heading">{ticket.subject}</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize', STATUS_STYLE[ticket.status] ?? 'bg-muted text-muted-foreground')}>
                  {ticket.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
                {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : messages.map((m) => <MessageBubble key={m.id} message={m} />)}
              </div>

              {isClosed ? (
                <p className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                  This ticket is closed. If you still need help, please raise a new ticket.
                </p>
              ) : (
                <div className="border-t border-border pt-4">
                  <Textarea rows={3} placeholder="Type your reply..." value={content} onChange={(e) => setContent(e.target.value)} />
                  {replyError && <p className="mt-1.5 text-xs font-medium text-destructive">{replyError}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <Paperclip className="size-3.5" />
                      {files.length > 0 ? `${files.length} file(s)` : 'Attach'}
                      <input type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                    </label>
                    <Button size="sm" onClick={handleReply} disabled={!content.trim()} loading={replyToTicket.isPending}>
                      <Send className="size-3.5" /> Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}
    </AccountLayout>
  );
}
