import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Send, Mail, MessageCircle, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/global/FormField';
import { DataTable } from '@/components/global/DataTable';
import { DEFAULT_PAGE_SIZE } from '@/config/appConfig';
import { useBroadcasts, useBroadcast, useCreateBroadcast, useDeactivateBroadcast } from './broadcastApi';
import { broadcastSchema, broadcastFormDefaults, BROADCAST_CHANNELS, BROADCAST_STATUS_VARIANTS } from './broadcastSchema';

const CHANNEL_ICONS = { email: Mail, whatsapp: MessageCircle, website: Globe };

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

function ChannelCheckbox({ value, label, control, name }) {
  const Icon = CHANNEL_ICONS[value];
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const checked = field.value?.includes(value);
        const toggle = () => {
          field.onChange(checked ? field.value.filter((c) => c !== value) : [...field.value, value]);
        };
        return (
          <label
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
          >
            <Checkbox checked={checked} onCheckedChange={toggle} />
            <Icon className="size-4 text-muted-foreground" />
            {label}
          </label>
        );
      }}
    />
  );
}

// Polls the just-created broadcast every 2s while it's still pending/
// sending so the admin sees live send progress right after submitting -
// no job queue/websocket infra exists in this backend to push it instead.
function ProgressCard({ broadcastId }) {
  const { data: broadcast } = useBroadcast(broadcastId, {
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'sending' ? 2000 : false;
    },
  });
  if (!broadcast) return null;

  const { stats, status } = broadcast;
  const isDone = status === 'completed' || status === 'failed';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{isDone ? 'Broadcast sent' : 'Sending broadcast...'}</CardTitle>
          <Badge variant={BROADCAST_STATUS_VARIANTS[status] ?? 'secondary'} className="capitalize">
            {status}
          </Badge>
        </div>
        <CardDescription>{broadcast.title}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Recipients</p>
          <p className="text-lg font-semibold text-heading">{stats.totalRecipients}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email sent</p>
          <p className="text-lg font-semibold text-heading">
            {stats.emailSent}
            <span className="text-xs font-normal text-muted-foreground"> / {stats.emailFailed} failed</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">WhatsApp sent</p>
          <p className="text-lg font-semibold text-heading">
            {stats.whatsappSent}
            <span className="text-xs font-normal text-muted-foreground"> / {stats.whatsappFailed} failed</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Skipped (opted out)</p>
          <p className="text-lg font-semibold text-heading">{stats.emailSkipped + stats.whatsappSkipped}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BroadcastComposePage() {
  const [page, setPage] = useState(1);
  const [lastBroadcastId, setLastBroadcastId] = useState(null);
  const createBroadcast = useCreateBroadcast();
  const deactivateBroadcast = useDeactivateBroadcast();
  const { data, isLoading, error, refetch } = useBroadcasts({ page, limit: DEFAULT_PAGE_SIZE });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(broadcastSchema), defaultValues: broadcastFormDefaults });

  const channels = watch('channels');
  const showWebsiteExpiry = channels?.includes('website');

  const onSubmit = async (values) => {
    try {
      const created = await createBroadcast.mutateAsync({
        ...values,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      });
      toast.success('Broadcast started - sending to email/WhatsApp in the background.');
      setLastBroadcastId(created.id);
      reset(broadcastFormDefaults);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateBroadcast.mutateAsync(id);
      toast.success('Website banner turned off');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const broadcasts = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, totalPages: 1, totalItems: 0 };

  const columns = [
    {
      key: 'title',
      header: 'Broadcast',
      render: (b) => (
        <div>
          <span className="font-medium text-heading">{b.title}</span>
          <p className="mt-0.5 max-w-80 truncate text-xs text-muted-foreground">{b.message}</p>
        </div>
      ),
    },
    {
      key: 'channels',
      header: 'Channels',
      render: (b) => (
        <div className="flex gap-1">
          {b.channels.map((c) => (
            <Badge key={c} variant="outline" className="capitalize">
              {c}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Sent',
      render: (b) => (
        <span className="text-sm text-muted-foreground">
          {b.stats.totalRecipients} recipients &middot; {b.stats.emailSent + b.stats.whatsappSent} sent
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <Badge variant={BROADCAST_STATUS_VARIANTS[b.status] ?? 'secondary'} className="capitalize">
          {b.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Sent at', render: (b) => <span className="text-sm text-muted-foreground">{formatDateTime(b.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-32',
      render: (b) =>
        b.channels.includes('website') && b.isActive ? (
          <Button variant="ghost" size="sm" onClick={() => handleDeactivate(b.id)}>
            Turn off banner
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h4 font-semibold text-heading">Broadcast</h1>
        <p className="text-sm text-muted-foreground">
          Send one message to every customer at once, across email, WhatsApp, and an on-site announcement banner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compose broadcast</CardTitle>
          <CardDescription>Respects each customer's communication preferences - opted-out customers are skipped automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
              <Input id="title" placeholder="e.g. Diwali Sale is Live!" {...register('title')} />
            </FormField>

            <FormField label="Message" htmlFor="message" required error={errors.message?.message}>
              <Textarea id="message" rows={4} placeholder="Write the message customers will see/receive..." {...register('message')} />
            </FormField>

            <FormField label="Send via" required error={errors.channels?.message}>
              <div className="flex flex-wrap gap-2">
                {BROADCAST_CHANNELS.map((c) => (
                  <ChannelCheckbox key={c.value} value={c.value} label={c.label} control={control} name="channels" />
                ))}
              </div>
            </FormField>

            {showWebsiteExpiry && (
              <FormField label="Website banner expires (optional)" htmlFor="expiresAt" description="Leave blank to keep the banner up until you turn it off manually.">
                <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
              </FormField>
            )}

            <div>
              <Button type="submit" disabled={isSubmitting}>
                <Send />
                Send broadcast
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {lastBroadcastId && <ProgressCard broadcastId={lastBroadcastId} />}

      <div>
        <h2 className="mb-3 text-h5 font-semibold text-heading">History</h2>
        <DataTable
          columns={columns}
          data={broadcasts}
          rowKey={(b) => b.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No broadcasts yet"
          emptyDescription="Sent broadcasts will show up here with live delivery stats."
          pagination={{
            page: meta.page,
            totalPages: meta.totalPages,
            totalItems: meta.totalItems,
            pageSize: DEFAULT_PAGE_SIZE,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}
