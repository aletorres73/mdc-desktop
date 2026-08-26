import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Store } from "@tauri-apps/plugin-store";
import {
  signIn as fbSignIn,
  signUp as fbSignUp,
  refreshIdToken,
  updatePassword as fbUpdatePassword,
} from "@/lib/firebase/auth";
import type { AppUser, AuthSession } from "@/lib/firebase/types";

// ─── Constants (matches DesktopAuthRepository prefs keys) ───
const STORE_FILE = "auth-store.json";
const SESSION_KEY = "auth_session";

// Detect Tauri environment (Store only works inside Tauri window)
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

// Safe store helpers that gracefully handle browser mode (for testing)
async function safeStoreGet<T>(key: string): Promise<T | null> {
  if (!isTauri()) return null;
  try {
    const store = await Store.load(STORE_FILE);
    return (await store.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

async function safeStoreSet<T>(key: string, value: T): Promise<void> {
  if (!isTauri()) return;
  try {
    const store = await Store.load(STORE_FILE);
    await store.set(key, value);
    await store.save();
  } catch {
    // Silently fail in browser mode
  }
}

async function safeStoreDelete(key: string): Promise<void> {
  if (!isTauri()) return;
  try {
    const store = await Store.load(STORE_FILE);
    await store.delete(key);
    await store.save();
  } catch {
    // Silently fail in browser mode
  }
}

// ─── Context Shape ───
interface AuthContextValue {
  /** Domain user (uid, email, displayName) — matches Kotlin AppUser */
  user: AppUser | null;
  /** Raw session with tokens — stored in tauri-plugin-store */
  session: AuthSession | null;
  isLoading: boolean;
  /** Get the current idToken for API calls */
  getIdToken: () => string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted session on mount (mirrors DesktopAuthRepository.restoreSession)
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const stored = await safeStoreGet<AuthSession>(SESSION_KEY);

        if (!cancelled && stored) {
          // Check if token is expired (with 5 min buffer)
          const now = Date.now();
          const buffer = 5 * 60 * 1000;
          if (stored.expiresIn && now < stored.expiresIn - buffer) {
            // Token still valid
            setUser({ uid: stored.localId, email: stored.email });
            setSession(stored);
          } else if (stored.refreshToken) {
            // Try to refresh (mirrors DesktopAuthRepository.restoreSession → refreshIdToken)
            try {
              const refreshed = await refreshIdToken(stored.refreshToken);
              const newSession: AuthSession = {
                idToken: refreshed.id_token,
                refreshToken: refreshed.refresh_token,
                expiresIn: parseInt(refreshed.expires_in),
                localId: stored.localId,
                email: stored.email,
              };
              await persistSession(newSession);
              setUser({ uid: newSession.localId, email: newSession.email });
              setSession(newSession);
            } catch {
              // Refresh failed — clear session
              await clearStoredSession();
            }
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // ─── Persist / Clear helpers (mirrors DesktopAuthRepository.saveSession/clearSession) ───
  const persistSession = async (s: AuthSession) => {
    await safeStoreSet(SESSION_KEY, s);
  };

  const clearStoredSession = async () => {
    await safeStoreDelete(SESSION_KEY);
  };

  // ─── Auth actions ───
  const login = useCallback(async (email: string, password: string) => {
    const res = await fbSignIn(email, password);
    const newSession: AuthSession = {
      idToken: res.idToken,
      refreshToken: res.refreshToken,
      expiresIn: parseInt(res.expiresIn),
      localId: res.localId,
      email: res.email,
    };
    await persistSession(newSession);
    setUser({ uid: res.localId, email: res.email, displayName: res.displayName });
    setSession(newSession);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await fbSignUp(email, password, displayName || email);
      const newSession: AuthSession = {
        idToken: res.idToken,
        refreshToken: res.refreshToken,
        expiresIn: parseInt(res.expiresIn),
        localId: res.localId,
        email: res.email,
      };
      await persistSession(newSession);
      setUser({ uid: res.localId, email: res.email, displayName: res.displayName });
      setSession(newSession);
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    setSession(null);
    await clearStoredSession();
  }, []);

  const getIdToken = useCallback(() => session?.idToken ?? null, [session]);

  const refreshSession = useCallback(async () => {
    if (!session?.refreshToken) throw new Error("No refresh token available");
    const refreshed = await refreshIdToken(session.refreshToken);
    const newSession: AuthSession = {
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token,
      expiresIn: parseInt(refreshed.expires_in),
      localId: session.localId,
      email: session.email,
    };
    await persistSession(newSession);
    setSession(newSession);
  }, [session]);

  const reauthenticate = useCallback(
    async (password: string) => {
      if (!user?.email) throw new Error("No user logged in");
      await login(user.email, password);
    },
    [user]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const token = session?.idToken;
      if (!token) throw new Error("No idToken available");
      await fbUpdatePassword(token, newPassword);
    },
    [session]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        getIdToken,
        login,
        register,
        logout,
        refreshSession,
        reauthenticate,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
