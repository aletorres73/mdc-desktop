import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  signIn,
  signUp,
  signOut,
  updateUserPassword,
  reauthenticate as reauthenticateUser,
  onAuthStateChange,
} from "@/data/datasources/client";
import { auth } from "@/data/datasources/client";
import type { User as FirebaseUser } from "firebase/auth";

// ─── Types ───
interface AuthContextValue {
  user: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to auth state changes (Firebase SDK handles persistence automatically)
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Auth actions ───
  const login = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      await signUp(email, password, displayName);
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    await updateUserPassword(newPassword);
  }, []);

  const reauthenticate = useCallback(async (password: string) => {
    await reauthenticateUser(password);
  }, []);

  const getIdToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updatePassword,
        reauthenticate,
        getIdToken,
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