import { useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

import { Drawer } from '@/components/global/Drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useAssignIssue, useUpdateIssueStatus } from './issuesApi';
import { ISSUE_CATEGORIES, ISSUE_STATUSES, ISSUE_STATUS_VARIANTS } from './issuesSchema';

const categoryLabel = (value) => ISSUE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function IssueDetailDrawer({ open, onOpenChange, issue }) {
  const currentUser = useAuthStore((s) => s.user);
  const assignIssue = useAssignIssue();
  const updateStatus = useUpdateIssueStatus();
  const [resolutionNote, setResolutionNote] = useState('');

  if (!issue) return null;

  const handleAssignToMe = async () => {
    try {
      await assignIssue.mutateAsync({ id: issue.id, assigneeUserId: currentUser.id });
      toast.success('Issue assigned to you');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus.mutateAsync({ id: issue.id, status, resolutionNote: resolutionNote.trim() || undefined });
      toast.success('Issue status updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={issue.issueNumber} description={categoryLabel(issue.category)} className="sm:max-w-md">
      <div className="flex flex-col gap-5 py-4">
        <div className="flex items-center gap-2">
          <Badge variant={ISSUE_STATUS_VARIANTS[issue.status] ?? 'secondary'} className="capitalize">
            {issue.status.replace(/_/g, ' ')}
          </Badge>
          {issue.subCategory && <Badge variant="outline">{issue.subCategory.replace(/_/g, ' ')}</Badge>}
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-heading">Reported by</h3>
          <p className="text-sm text-heading">{issue.reporter?.name}</p>
          <p className="text-xs text-muted-foreground">{issue.reporter?.phone} · {issue.reporter?.email}</p>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-heading">Description</h3>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{issue.description}</p>
        </div>

        {(issue.entityType || issue.entityId) && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-heading">Linked to</h3>
            <p className="text-xs text-muted-foreground">
              {issue.entityType} - <span className="font-mono">{issue.entityId}</span>
            </p>
          </div>
        )}

        {Object.keys(issue.metadata ?? {}).length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-heading">Context</h3>
            <div className="flex flex-col gap-1 text-xs">
              {Object.entries(issue.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground capitalize">{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                  <span className="truncate text-heading">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {issue.attachments?.length > 0 && (
          <div>
            <h3 className="mb-1 text-sm font-semibold text-heading">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {issue.attachments.map((a) => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                  View file
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Reported {formatDate(issue.createdAt)}</p>

        <div className="border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-heading">Assigned to</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{issue.assignedTo?.name ?? 'Unassigned'}</span>
            {issue.assignedTo?.id !== currentUser?.id && (
              <Button variant="outline" size="sm" onClick={handleAssignToMe} disabled={assignIssue.isPending}>
                <UserPlus className="size-3.5" /> Assign to me
              </Button>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-heading">Resolution note</h3>
          <Textarea rows={2} placeholder="What did you do to resolve this?" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-heading">Change status</h3>
          <Select value="" onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a new status" />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Drawer>
  );
}
