import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
