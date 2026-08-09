import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/global/Modal';
import { FormField } from '@/components/global/FormField';
import { EmptyState } from '@/components/global/EmptyState';
import { useTaxRates, useCreateTaxRate, useUpdateTaxRate, useDeleteTaxRate, useTaxSummary } from './taxRatesApi';

const EMPTY_FORM = { name: '', rate: '', cgstRate: '', sgstRate: '', igstRate: '' };

export function TaxRatesTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: rates } = useTaxRates();
  const { data: summary } = useTaxSummary();
  const createRate = useCreateTaxRate();
  const updateRate = useUpdateTaxRate();
  const deleteRate = useDeleteTaxRate();

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.rate) {
      toast.error('Name and rate are required');
      return;
    }
    try {
      await createRate.mutateAsync({
        name: form.name.trim(),
        rate: Number(form.rate),
        cgstRate: Number(form.cgstRate) || Number(form.rate) / 2,
        sgstRate: Number(form.sgstRate) || Number(form.rate) / 2,
        igstRate: Number(form.igstRate) || Number(form.rate),
      });
      toast.success('Tax rate added');
      setModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await updateRate.mutateAsync({ id, isDefault: true });
      toast.success('Default tax rate updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRate.mutateAsync(id);
      toast.success('Tax rate removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-heading">Tax rates</p>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="size-4" /> New rate</Button>
        </div>
        {!rates || rates.length === 0 ? (
          <EmptyState title="No tax rates configured" description="Add GST rates for future configurable use." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rates.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-heading">{r.name}</span>
                  {r.isDefault && <Badge variant="info" className="ml-2">Default</Badge>}
                  <p className="text-xs text-muted-foreground">CGST {r.cgstRate}% · SGST {r.sgstRate}% · IGST {r.igstRate}%</p>
                </div>
                <div className="flex items-center gap-1">
                  {!r.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(r.id)}><Star className="size-3.5" /> Set default</Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-heading">Tax ledger summary</p>
        {!summary || summary.length === 0 ? (
          <EmptyState title="No tax activity yet" description="Input/Output GST postings will summarize here." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                  <th className="px-3 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.accountId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{row.code} - {row.name}</td>
                    <td className="px-3 py-2 text-right">₹{row.debit.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">₹{row.credit.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">₹{row.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New tax rate"
        className="sm:max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRate.isPending}>{createRate.isPending ? 'Adding...' : 'Add rate'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name" required description="e.g. GST 3% (Jewellery)">
            <Input value={form.name} onChange={setField('name')} />
          </FormField>
          <FormField label="Combined rate (%)" required>
            <Input type="number" min={0} value={form.rate} onChange={setField('rate')} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="CGST %">
              <Input type="number" min={0} value={form.cgstRate} onChange={setField('cgstRate')} />
            </FormField>
            <FormField label="SGST %">
              <Input type="number" min={0} value={form.sgstRate} onChange={setField('sgstRate')} />
            </FormField>
            <FormField label="IGST %">
              <Input type="number" min={0} value={form.igstRate} onChange={setField('igstRate')} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
