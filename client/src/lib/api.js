import { useAuthStore } from '@/store/authStore';

// Same Authorization-header + 401-retry shape as the admin panel's client
// (frontend/src/lib/api.js) - the thing this file's own comment used to
// flag as "once Customer Auth ships" future work. Not a rewrite of that
// pattern, the same one.
//
// Relative by default - works out of the box in dev (Vite's own /api
// proxy, see vite.config.js) and in any production setup where this app's
// own domain reverse-proxies /api/v1 to the backend. Only needs
// VITE_API_BASE_URL set when the storefront and backend are on genuinely
// different domains with no such proxy in front - set it to that
// backend's full origin (e.g. https://api.yourdomain.com/api/v1).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function buildUrl(path, params) {
  if (!params) return path;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

async function request(path, { method = 'GET', body, params, skipAuth = false, retry = true } = {}) {
  const accessToken = useAuthStore.getState().accessToken;
  const url = buildUrl(path, params);

  // FormData (file-attachment uploads - issue reports, support tickets)
  // must NOT be JSON.stringify'd (that silently serializes it to "{}",
  // dropping every field) and must NOT get an explicit Content-Type - the
  // browser sets `multipart/form-data; boundary=...` itself only when the
  // header is left unset.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(!skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  // One silent retry, backed by the real refresh-token cookie (see
  // authStore.js#refreshSession) - not a loop (`retry: false` on the
  // replay), so an already-invalid session fails once and clears, instead
  // of hammering /refresh-token forever.
  if (res.status === 401 && retry && !skipAuth) {
    const refreshed = await useAuthStore.getState().refreshSession();
    if (refreshed) {
      return request(path, { method, body, params, skipAuth, retry: false });
    }
  }

  if (!res.ok) {
    // A request-validation failure (validate.middleware.js) always sends
    // the same generic top-level message ("Validation failed") plus the
    // real per-field reason in `errors` (e.g. "Enter a valid email
    // address") - surfacing that first field's message instead is what
    // makes e.g. a malformed newsletter email show something a customer
    // can actually act on. Every other error path (business-logic
    // ApiErrors - "Invalid credentials", "Coupon not found", ...) never
    // populates `errors`, so this only ever changes the validation case.
    const error = new Error(data?.errors?.[0]?.message || data?.message || 'Something went wrong');
    error.statusCode = res.status;
    error.errors = data?.errors;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
