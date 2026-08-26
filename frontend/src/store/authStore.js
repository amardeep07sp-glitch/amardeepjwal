import { create } from 'zustand';

const BASE_URL = '/api/v1/auth';

// Same optimization as the storefront's own authStore.js - the real
// refresh token is an httpOnly cookie JS can never read, so without this
// breadcrumb, bootstrap() would call /refresh-token unconditionally on
// every load and guarantee a 401 for anyone who has never logged in on
// this browser (e.g. first-ever visit to /admin/login). Just a plain,
// non-secret "a session existed at some point" flag - safe in localStorage.
const HAD_SESSION_KEY = 'adsp_admin_had_session';

const hadPriorSession = () => {
  try {
    return localStorage.getItem(HAD_SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

const rememberSession = (had) => {
  try {
    if (had) localStorage.setItem(HAD_SESSION_KEY, '1');
    else localStorage.removeItem(HAD_SESSION_KEY);
  } catch {
    // Unavailable (private mode etc.) - bootstrap just falls back to
    // always attempting a refresh, same as before this optimization.
  }
};

const authFetch = async (path, body, accessToken) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    // Tells the backend to set/read the admin ERP's OWN refresh-token
    // cookie, distinct from the storefront app's (see auth.controller.js)
    // - without this, logging into the customer storefront in another tab
    // would silently overwrite this admin session's cookie in the browser.
    headers: {
      'Content-Type': 'application/json',
      'X-App-Client': 'admin',
      // Only /logout needs this (it's `protect`-gated server-side to know
      // whose refresh-token cookie to clear) - without it the request 401s
      // before ever clearing the cookie, so "logout" doesn't actually end
      // the session and a page refresh silently signs the same admin back
      // in via bootstrap() -> refreshSession().
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || 'Authentication request failed');
  }
  return data.data;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isInitializing: true,

  setSession: ({ user, accessToken }) => {
    rememberSession(true);
    set({ user, accessToken });
  },

  clearSession: () => {
    rememberSession(false);
    set({ user: null, accessToken: null });
  },

  async login(identifier, password) {
    const result = await authFetch('/login', { identifier, password });
    get().setSession(result);
    return result;
  },

  async register(payload) {
    const result = await authFetch('/register', payload);
    get().setSession(result);
    return result;
  },

  async logout() {
    try {
      await authFetch('/logout', undefined, get().accessToken);
    } finally {
      get().clearSession();
    }
  },

  async refreshSession() {
    try {
      const result = await authFetch('/refresh-token');
      get().setSession(result);
      return true;
    } catch {
      get().clearSession();
      return false;
    }
  },

  async bootstrap() {
    if (hadPriorSession()) {
      await get().refreshSession();
    }
    set({ isInitializing: false });
  },
}));
