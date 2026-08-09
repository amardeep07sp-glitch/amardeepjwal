import { useAuthStore } from '@/store/authStore';

// Same Authorization-header + 401-retry shape as the admin panel's client
// (frontend/src/lib/api.js) - the thing this file's own comment used to
// flag as "once Customer Auth ships" future work. Not a rewrite of that
// pattern, the same one.
const BASE_URL = '/api/v1';

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

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(!skipAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
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
