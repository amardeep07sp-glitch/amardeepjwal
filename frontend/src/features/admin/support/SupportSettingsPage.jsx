import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/global/Loading';
import { ErrorState } from '@/components/global/ErrorState';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from './supportSchema';
import {
  useSlaPolicy,
  useUpdateSlaPolicy,
  useAssignmentRules,
  useSetAssignmentRule,
  useRemoveAssignmentRule,
  useStaffUsers,
} from './supportApi';

const NO_AGENT = 'none';

// Editable in whole hours (the underlying API stores minutes) - nobody
// configures an SLA deadline down to the minute in practice, and this
// keeps the inputs simple round numbers instead of "480 mins".
function SlaPolicyCard() {
  const { data: policy, isLoading, error, refetch } = useSlaPolicy();
  const updatePolicy = useUpdateSlaPolicy();
  const [tiers, setTiers] = useState({});

  useEffect(() => {
    if (!policy) return;
    const byPriority = {};
    TICKET_PRIORITIES.forEach(({ value }) => {
      const tier = policy.tiers.find((t) => t.priority === value);
      byPriority[value] = {
        firstResponseHours: tier ? Math.round(tier.firstResponseMins / 60) : 24,
        resolutionHours: tier ? Math.round(tier.resolutionMins / 60) : 48,
      };
    });
    setTiers(byPriority);
  }, [policy]);

  const handleChange = (priority, field, value) => {
    setTiers((prev) => ({ ...prev, [priority]: { ...prev[priority], [field]: Number(value) || 0 } }));
  };

  const handleSave = async () => {
    const payload = TICKET_PRIORITIES.map(({ value }) => ({
      priority: value,
      firstResponseMins: Math.max(1, (tiers[value]?.firstResponseHours ?? 24) * 60),
      resolutionMins: Math.max(1, (tiers[value]?.resolutionHours ?? 48) * 60),
    }));
    try {
      await updatePolicy.mutateAsync(payload);
      toast.success('SLA policy saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading SLA policy..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SLA Policy</CardTitle>
        <p className="text-sm text-muted-foreground">
          First-response and resolution deadlines per priority. A sweep runs every 10 minutes and flags any ticket still open past its deadline.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_repeat(2,140px)] gap-3 text-xs font-medium text-muted-foreground">
          <span>Priority</span>
          <span>First response (hrs)</span>
          <span>Resolution (hrs)</span>
        </div>
        {TICKET_PRIORITIES.map(({ value, label }) => (
          <div key={value} className="grid grid-cols-[1fr_repeat(2,140px)] items-center gap-3">
            <span className="text-sm font-medium text-heading capitalize">{label}</span>
            <Input
              type="number"
              min={1}
              value={tiers[value]?.firstResponseHours ?? ''}
              onChange={(e) => handleChange(value, 'firstResponseHours', e.target.value)}
            />
            <Input
              type="number"
              min={1}
              value={tiers[value]?.resolutionHours ?? ''}
              onChange={(e) => handleChange(value, 'resolutionHours', e.target.value)}
            />
          </div>
        ))}
        <div>
          <Button type="button" onClick={handleSave} loading={updatePolicy.isPending}>
            Save SLA policy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// One row per ticket category - each can either have no default assignee
// (falls back to today's plain unassigned/manual-triage behavior) or a
// single default agent a new ticket in that category is auto-assigned to.
function AssignmentRulesCard() {
  const { data: rules, isLoading, error, refetch } = useAssignmentRules();
  const { data: staff } = useStaffUsers();
  const setRule = useSetAssignmentRule();
  const removeRule = useRemoveAssignmentRule();

  const ruleByCategory = new Map((rules ?? []).map((r) => [r.category, r]));
  const staffOptions = staff?.items ?? [];

  const handleChange = async (category, agentUserId) => {
    try {
      if (agentUserId === NO_AGENT) {
        await removeRule.mutateAsync(category);
        toast.success('Routing rule removed');
      } else {
        await setRule.mutateAsync({ category, agentUserId });
        toast.success('Routing rule saved');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageLoader label="Loading assignment rules..." />;
  if (error) return <ErrorState description={error.message} actionLabel="Retry" onAction={refetch} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Assignment Rules</CardTitle>
        <p className="text-sm text-muted-foreground">
          A new ticket in a category below is automatically assigned (and moved to In Progress) - leave "No default agent" to keep triaging that
          category manually.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {TICKET_CATEGORIES.map(({ value, label }) => {
          const rule = ruleByCategory.get(value);
          return (
            <div key={value} className="grid grid-cols-[1fr_260px] items-center gap-3">
              <span className="text-sm font-medium text-heading">{label}</span>
              <Select value={rule?.agent?.id ?? NO_AGENT} onValueChange={(v) => handleChange(value, v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No default agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AGENT}>No default agent</SelectItem>
                  {staffOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function SupportSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Support Settings</h1>
        <p className="text-sm text-muted-foreground">SLA deadlines and category-based auto-assignment for the support desk.</p>
      </div>

      <SlaPolicyCard />
      <AssignmentRulesCard />
    </div>
  );
}
