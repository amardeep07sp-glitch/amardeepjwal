import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMyTicket } from '@/features/support/supportApi';

const CATEGORIES = [
  { value: 'order', label: 'Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'return', label: 'Return' },
  { value: 'refund', label: 'Refund' },
  { value: 'product', label: 'Product' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'account', label: 'Account' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

// The reusable "Get Support" entry point (Phase 51/53) - opens a full
// support ticket (a real, ongoing conversation with an agent), as opposed
// to ReportProblemButton's one-shot issue report. `context` is whatever
// this page already knows (orderId, productId, ...) so it's attached
// automatically, never re-typed.
export function GetSupportButton({ category: defaultCategory = 'other', context = {}, triggerLabel = 'Get Support', variant = 'outline', className = '' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const createTicket = useCreateMyTicket();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitError('');
    const formData = new FormData();
    formData.append('subject', subject.trim());
    formData.append('category', category);
    formData.append('context', JSON.stringify(context));
    formData.append('message', message.trim());

    try {
      const ticket = await createTicket.mutateAsync(formData);
      setOpen(false);
      setSubject('');
      setMessage('');
      // The new ticket's own page confirms creation (ticket number, first
      // message) - no separate toast needed on top of that navigation.
      navigate(`/support/tickets/${ticket.id}`);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <>
      <Button type="button" variant={variant} size="sm" className={className} onClick={() => setOpen(true)}>
        <LifeBuoy className="size-3.5" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Get Support</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">Subject</label>
              <Input placeholder="A short summary" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">Message</label>
              <Textarea rows={4} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {submitError && <p className="text-xs font-medium text-destructive">{submitError}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSubmitError('');
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!subject.trim() || !message.trim()} loading={createTicket.isPending}>
              Create ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
