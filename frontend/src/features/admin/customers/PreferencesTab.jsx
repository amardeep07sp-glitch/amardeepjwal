import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/global/FormField';
import { usePreferences, useUpdatePreferences } from './customerPreferencesApi';

export function PreferencesTab({ customerId }) {
  const { data: preferences } = usePreferences(customerId);
  const updatePreferences = useUpdatePreferences();
  const [form, setForm] = useState({
    metalPreference: '',
    purityPreference: '',
    budgetMin: 0,
    budgetMax: 0,
    communicationPreference: { email: true, whatsapp: true, sms: false },
  });

  useEffect(() => {
    if (preferences) {
      setForm({
        metalPreference: preferences.metalPreference ?? '',
        purityPreference: preferences.purityPreference ?? '',
        budgetMin: preferences.budgetMin ?? 0,
        budgetMax: preferences.budgetMax ?? 0,
        communicationPreference: preferences.communicationPreference ?? { email: true, whatsapp: true, sms: false },
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({ customerId, ...form });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleComm = (channel) =>
    setForm((prev) => ({ ...prev, communicationPreference: { ...prev.communicationPreference, [channel]: !prev.communicationPreference[channel] } }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Metal preference" description="e.g. Gold, Silver, Platinum">
          <Input value={form.metalPreference} onChange={(e) => setForm((p) => ({ ...p, metalPreference: e.target.value }))} />
        </FormField>
        <FormField label="Purity preference" description="e.g. 22K, 18K">
          <Input value={form.purityPreference} onChange={(e) => setForm((p) => ({ ...p, purityPreference: e.target.value }))} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Budget min">
          <Input type="number" value={form.budgetMin} onChange={(e) => setForm((p) => ({ ...p, budgetMin: Number(e.target.value) }))} />
        </FormField>
        <FormField label="Budget max">
          <Input type="number" value={form.budgetMax} onChange={(e) => setForm((p) => ({ ...p, budgetMax: Number(e.target.value) }))} />
        </FormField>
      </div>
      <FormField label="Communication preference">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.communicationPreference.email} onCheckedChange={() => toggleComm('email')} /> Email</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.communicationPreference.whatsapp} onCheckedChange={() => toggleComm('whatsapp')} /> WhatsApp</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.communicationPreference.sms} onCheckedChange={() => toggleComm('sms')} /> SMS</label>
        </div>
      </FormField>
      <div>
        <Button onClick={handleSave} disabled={updatePreferences.isPending}>
          {updatePreferences.isPending ? 'Saving...' : 'Save preferences'}
        </Button>
      </div>
    </div>
  );
}
