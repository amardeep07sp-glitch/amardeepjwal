import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { useActiveBroadcasts } from '@/features/broadcast/broadcastApi';

const DISMISSED_KEY = 'adsp_dismissed_broadcasts';

function getDismissedIds() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function dismissId(id) {
  try {
    const dismissed = getDismissedIds();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]));
  } catch {
    // localStorage unavailable (private mode etc.) - dismissal just won't
    // persist across reloads, never a functional break.
  }
}

// Site-wide announcement strip for admin broadcasts sent via the 'website'
// channel (frontend's Broadcast page) - shown to every visitor, logged in
// or not, until dismissed (persisted per-browser) or the broadcast expires/
// is turned off by admin.
export function BroadcastBanner() {
  const { data: broadcasts } = useActiveBroadcasts();
  const [dismissed, setDismissed] = useState(() => getDismissedIds());

  useEffect(() => {
    setDismissed(getDismissedIds());
  }, [broadcasts]);

  const visible = (broadcasts ?? []).filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;
  const broadcast = visible[0];

  return (
    <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-primary/90 to-primary px-4 py-2.5 text-center text-sm text-primary-foreground">
      <Megaphone className="hidden size-4 shrink-0 sm:block" />
      <p className="min-w-0 truncate">
        <span className="font-semibold">{broadcast.title}</span>
        <span className="mx-1.5 opacity-70">&middot;</span>
        <span className="opacity-90">{broadcast.message}</span>
      </p>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          dismissId(broadcast.id);
          setDismissed((prev) => [...prev, broadcast.id]);
        }}
        className="absolute right-3 shrink-0 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
