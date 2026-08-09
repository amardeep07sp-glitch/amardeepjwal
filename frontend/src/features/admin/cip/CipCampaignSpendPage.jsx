import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useCampaignSpend, useCreateCampaignSpend, useDeleteCampaignSpend } from './cipApi';

const EMPTY_FORM = { utmCampaign: '', spend: '', dateFrom: '', dateTo: '', notes: '' };

export default function CipCampaignSpendPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: rows } = useCampaignSpend();
  const createSpend = useCreateCampaignSpend();
  const deleteSpend = useDeleteCampaignSpend();

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.utmCampaign.trim() || !form.spend || !form.dateFrom || !form.dateTo) {
      toast.error('Campaign, spend, and date range are required');
      return;
    }
    try {
      await createSpend.mutateAsync(form);
      toast.success('Campaign spend recorded');
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSpend.mutateAsync(id);
      toast.success('Removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h4 font-semibold text-heading">Campaign Ad Spend</h1>
          <p className="text-sm text-muted-foreground">Record what a campaign cost so the Campaign Report can compute real ROAS.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus /> Record spend</Button>
      </div>

      {!rows || rows.length === 0 ? (
        <EmptyState title="No campaign spend recorded yet" description="ROAS shows as unavailable until spend is entered for a utm_campaign." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2 text-right">Spend</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{r.utmCampaign}</td>
                  <td className="px-3 py-2 text-right">₹{r.spend.toFixed(2)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.dateFrom).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.dateTo).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.notes || '—'}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(r._id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Record campaign spend"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSpend.isPending}>{createSpend.isPending ? 'Saving...' : 'Save'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="UTM Campaign" required description="Must match utm_campaign exactly as used in ad links">
            <Input value={form.utmCampaign} onChange={setField('utmCampaign')} />
          </FormField>
          <FormField label="Spend (₹)" required>
            <Input type="number" min={0} value={form.spend} onChange={setField('spend')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="From" required>
              <Input type="date" value={form.dateFrom} onChange={setField('dateFrom')} />
            </FormField>
            <FormField label="To" required>
              <Input type="date" value={form.dateTo} onChange={setField('dateTo')} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Input value={form.notes} onChange={setField('notes')} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
