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
// Same VITE_API_BASE_URL override as lib/api.js - this file has its own
// fetch implementation (never goes through api.js) so it needs the exact
// same env-aware base, or login/register/refresh would keep hitting this
// app's own domain instead of the real backend on any deployment where
// they're on different origins (see api.js's own comment for when that's
// needed).
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth`;

// The real refresh token itself is an httpOnly cookie (JS can never read
// it, by design), so there's no way to check "is there actually a session
// to restore" before firing the request - without this flag, bootstrap()
// would call /refresh-token unconditionally on every single page load,
// guaranteeing a 401 for every guest visitor who has never logged in (this
// is exactly what showed up as two failing refresh-token requests in
// devtools - one per React StrictMode's dev-only double effect run). This
// is just a plain, non-httpOnly breadcrumb ("a session existed at some
// point") - it carries no secret, so localStorage is fine for it.
const HAD_SESSION_KEY = 'adsp_had_session';

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
    // Tells the backend to set/read the storefront's OWN refresh-token
    // cookie, distinct from the admin ERP app's (see auth.controller.js)
    // - without this, logging into the admin panel in another tab would
    // silently overwrite this storefront session's cookie in the browser.
    headers: {
      'Content-Type': 'application/json',
      'X-App-Client': 'storefront',
      // Only /logout actually needs this (it's `protect`-gated on the
      // backend so it knows whose refresh-token cookie to clear) - without
      // it the request 401s before ever reaching res.clearCookie(), so the
      // refresh cookie survives "logout" and a page refresh silently signs
      // the same visitor back in via bootstrap() -> refreshSession().
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
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

// The real fix for the "logged out mid-checkout" bug: refresh tokens rotate
// server-side (auth.service.js#refresh issues a brand-new one and
// overwrites refreshTokenHash every time) - a security good practice, but
// it means only the FIRST of several requests that all 401 at once (e.g.
// checkout firing off addresses/cart/product-list calls together right as
// the access token expires) can actually redeem the refresh cookie.
// Without this guard, every other simultaneous 401 would independently call
// /refresh-token with that same now-already-spent cookie, get "Invalid
// session" back, and clearSession() - signing the customer out of a session
// that was, in reality, perfectly fine. Caching the in-flight promise so
// every concurrent caller awaits the one real network call instead of
// starting their own is the standard fix for this exact race.
let refreshPromise = null;

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isInitializing: true,

  setSession: ({ user, accessToken }) => {
    rememberSession(true);
    set({ user, accessToken });
  },

  // Keeps the header/sidebar's cached `user.name`/`phone` in sync right
  // after a real profile update (storefrontApi.js#useUpdateMyProfile) -
  // without this, the login response's snapshot would stay stale until
  // the next full session refresh.
  patchUser: (partial) => set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),

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

  // Same backend endpoint handles both signup and login for Google (see
  // auth.controller.js#googleLogin) - there's no separate "register with
  // Google" action here for the same reason.
  async loginWithGoogle(idToken) {
    const result = await authFetch('/google', { idToken });
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

  // api.js calls this itself on a 401 before giving up on a request - a
  // stale/expired accessToken shouldn't sign a visitor out mid-browse if
  // their refresh cookie is still good.
  async refreshSession() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const result = await authFetch('/refresh-token');
        get().setSession(result);
        return true;
      } catch {
        get().clearSession();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  // Called once, at app start (see App.jsx) - the one deliberate exception
  // to "session state lives only from an explicit login", since restoring
  // an existing session from the refresh cookie is exactly what "stay
  // logged in" means. Skips the network call entirely for a visitor who
  // has never logged in on this browser (see HAD_SESSION_KEY above) -
  // a guest doesn't need to fail a refresh-token request just to learn
  // they're a guest.
  async bootstrap() {
    if (hadPriorSession()) {
      await get().refreshSession();
    }
    set({ isInitializing: false });
  },
}));
