import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { track } from '@/lib/analytics';

// Thin react-query wrappers around authStore's own login/register/logout
// (real /auth/* calls, session bookkeeping and all - see authStore.js) -
// this file exists to give the UI isPending/isError/error for free, and to
// fire the matching CIP event at the one point each action is known to
// have actually succeeded. That tracking lives here (not inside
// authStore.js itself) deliberately - analytics.js already reads the
// current user off authStore to attribute every event, so authStore.js
// importing analytics.js back would be a circular import.
export const useRegister = () => {
  const register = useAuthStore((s) => s.register);
  return useMutation({
    mutationFn: async (payload) => {
      const result = await register(payload);
      track('register');
      return result;
    },
  });
};

export const useLogin = () => {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async ({ identifier, password }) => {
      const result = await login(identifier, password);
      track('login');
      return result;
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => {
      // Before logout() runs (not after) - it clears the session, and
      // track() attributes to whoever is currently logged in at the
      // moment it's called.
      track('logout');
      return logout();
    },
  });
};
