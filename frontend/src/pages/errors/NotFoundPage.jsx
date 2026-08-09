import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/global/ErrorState';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <ErrorState
        icon={FileQuestion}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        actionLabel="Go to dashboard"
        onAction={() => navigate('/admin/dashboard')}
      />
    </div>
  );
}
