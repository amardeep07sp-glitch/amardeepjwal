import { create } from 'zustand';

// Same shape as the admin panel's own store (frontend/src/store/authStore.js)
// - deliberately not a from-scratch design. accessToken lives in memory only
// (never localStorage - an XSS-stolen access token is bad enough without
// also handing over a long-lived one sitting in storage); staying logged in
// across a reload instead comes from the real httpOnly refresh-token cookie
// the backend already sets on login/register (auth.controller.js), replayed
// via `bootstrap()` below. `isInitializing` gates the header's logged-in-vs-
// signed-out render until that one silent check resolves, so a returning
// visitor never flashes "Sign in" before flipping to their name.
const BASE_URL = '/api/v1/auth';

const authFetch = async (path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    // Tells the backend to set/read the storefront's OWN refresh-token
    // cookie, distinct from the admin ERP app's (see auth.controller.js)
    // - without this, logging into the admin panel in another tab would
    // silently overwrite this storefront session's cookie in the browser.
    headers: { 'Content-Type': 'application/json', 'X-App-Client': 'storefront' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || 'Authentication request failed');
    error.statusCode = res.status;
    throw error;
  }
  return data.data;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isInitializing: true,

  setSession: ({ user, accessToken }) => set({ user, accessToken }),

  // Keeps the header/sidebar's cached `user.name`/`phone` in sync right
  // after a real profile update (storefrontApi.js#useUpdateMyProfile) -
  // without this, the login response's snapshot would stay stale until
  // the next full session refresh.
  patchUser: (partial) => set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),

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

  // api.js calls this itself on a 401 before giving up on a request - a
  // stale/expired accessToken shouldn't sign a visitor out mid-browse if
  // their refresh cookie is still good.
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

  // Called once, at app start (see App.jsx) - the one deliberate exception
  // to "session state lives only from an explicit login", since restoring
  // an existing session from the refresh cookie is exactly what "stay
  // logged in" means.
  async bootstrap() {
    await get().refreshSession();
    set({ isInitializing: false });
  },
}));
