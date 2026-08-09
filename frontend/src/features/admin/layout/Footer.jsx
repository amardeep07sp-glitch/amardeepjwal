import { APP_NAME } from '@/config/appConfig';

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
      © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </footer>
  );
}
