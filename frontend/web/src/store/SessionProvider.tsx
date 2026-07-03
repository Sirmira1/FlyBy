"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserRow } from "@/core/db-types";
import { getBrowserSupabase } from "@/lib/supabase/client";

interface SessionValue {
  profile: UserRow | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch the profile (e.g. after a settings change). */
  refresh: () => Promise<void>;
  /** Optimistically merge fields into the cached profile. */
  patchProfile: (patch: Partial<UserRow>) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        setError("Could not load your profile");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setEmail(data.email ?? null);
      setError(null);
    } catch {
      setError("Could not load your profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const patchProfile = useCallback((patch: Partial<UserRow>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await getBrowserSupabase().auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<SessionValue>(
    () => ({ profile, email, loading, error, refresh, patchProfile, signOut }),
    [profile, email, loading, error, refresh, patchProfile, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
