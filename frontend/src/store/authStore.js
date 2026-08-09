import { create } from 'zustand';

const BASE_URL = '/api/v1/auth';

const authFetch = async (path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    // Tells the backend to set/read the admin ERP's OWN refresh-token
    // cookie, distinct from the storefront app's (see auth.controller.js)
    // - without this, logging into the customer storefront in another tab
    // would silently overwrite this admin session's cookie in the browser.
    headers: { 'Content-Type': 'application/json', 'X-App-Client': 'admin' },
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

  setSession: ({ user, accessToken }) => set({ user, accessToken }),

  clearSession: () => set({ user: null, accessToken: null }),

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
      await authFetch('/logout');
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
    await get().refreshSession();
    set({ isInitializing: false });
  },
}));
