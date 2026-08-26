import { useAuthStore } from '@/store/authStore';

// Relative by default - works out of the box in dev (Vite's own /api proxy,
// see vite.config.js) and in any production setup where this app's own
// domain reverse-proxies /api/v1 to the backend. Only needs
// VITE_API_BASE_URL set when the admin panel and backend are on genuinely
// different domains with no such proxy in front (e.g. this app deployed to
// Vercel, backend deployed separately on Render/Railway/a VPS) - set it to
// that backend's full origin (e.g. https://api.yourdomain.com/api/v1).
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
  const isFormData = body instanceof FormData;

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    credentials: 'include',
    headers: {
      // Never set Content-Type for FormData - the browser must add its own
      // multipart boundary, which we can't replicate manually.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(!skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (res.status === 401 && retry && !skipAuth) {
    const refreshed = await useAuthStore.getState().refreshSession();
    if (refreshed) {
      return request(path, { method, body, params, skipAuth, retry: false });
    }
    useAuthStore.getState().clearSession();
  }

  if (!res.ok) {
    const error = new Error(data?.message || 'Something went wrong');
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
