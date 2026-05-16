"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ApiError,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  mergeAuthUser,
  signup as apiSignup,
  updateProfile as apiUpdateProfile,
  type AuthUser,
  type UpdateProfileParams,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (params: {
    email: string;
    name: string;
    password: string;
    password_confirmation: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchMe();
      setUser(mergeAuthUser(res));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    const user = mergeAuthUser(res);
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(
    async (params: {
      email: string;
      name: string;
      password: string;
      password_confirmation: string;
    }) => {
      const res = await apiSignup(params);
      const user = mergeAuthUser(res);
      setUser(user);
      return user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (params: UpdateProfileParams) => {
    const res = await apiUpdateProfile(params);
    const user = mergeAuthUser(res);
    setUser(user);
    return user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, signup, logout, refresh, updateProfile }),
    [user, loading, login, signup, logout, refresh, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/**
 * Returns a guard function. Call `requireAuth()` before performing an action
 * that requires a signed-in user. Returns `true` when the user is signed in,
 * otherwise redirects to `/login?next=...` and returns `false`.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(() => {
    if (user) return true;
    const next = pathname || "/";
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
  }, [user, router, pathname]);
}
