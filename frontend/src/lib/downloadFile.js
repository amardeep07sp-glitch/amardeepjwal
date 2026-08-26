import { useAuthStore } from '@/store/authStore';

// Same VITE_API_BASE_URL override as api.js - this file has its own fetch
// call (a file download can't reuse api.js's JSON-only request()), so it
// needs the same env-aware base independently.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Streams a file response (CSV today, Excel/PDF later) and triggers a
// browser download. Kept separate from api.js's request() because that
// helper always assumes a JSON body - a file export never sends one.
export async function downloadFile(path, { filename } = {}) {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!res.ok) {
    let message = 'Download failed';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // Response wasn't JSON - keep the generic message.
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const resolvedFilename = filename || match?.[1] || 'download';

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = resolvedFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
