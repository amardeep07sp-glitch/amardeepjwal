import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useContacts, useCreateContact, useDeleteContact } from './customerContactsApi';

const EMPTY_FORM = { name: '', designation: '', email: '', phone: '' };

export function ContactsTab({ customerId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: contacts } = useContacts(customerId);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await createContact.mutateAsync({ customerId, ...form });
      toast.success('Contact added');
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact.mutateAsync(id);
      toast.success('Contact removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus /> Add contact
        </Button>
      </div>

      {!contacts || contacts.length === 0 ? (
        <EmptyState title="No contacts yet" description="Add named contacts for a B2B/wholesale account." />
      ) : (
        <ul className="flex flex-col gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-heading">{c.name}</span>
                {c.isPrimary && <Badge variant="info" className="ml-2">Primary</Badge>}
                {c.designation && <span className="text-muted-foreground"> · {c.designation}</span>}
                <p className="text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Remove contact" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add contact"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createContact.isPending}>
              {createContact.isPending ? 'Adding...' : 'Add contact'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={setField('name')} />
          </FormField>
          <FormField label="Designation">
            <Input value={form.designation} onChange={setField('designation')} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={setField('email')} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={setField('phone')} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
