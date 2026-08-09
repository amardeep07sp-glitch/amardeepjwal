import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/global/ErrorState';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <ErrorState
        icon={ShieldAlert}
        title="Access denied"
        description="You don't have permission to view this page."
        actionLabel="Go back"
        onAction={() => navigate(-1)}
      />
    </div>
  );
}
