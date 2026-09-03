import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { container } from "@/di/container";
import { auth } from "@/data/datasources/client";
import type { AppUser } from "@/domain/entities/user";

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = container.authUseCase.onAuthStateChange((appUser) => {
      setUser(appUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await container.authUseCase.signIn(email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      await container.authUseCase.signUp(email, password, displayName);
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    await container.authUseCase.sendPasswordReset(email);
  }, []);

  const logout = useCallback(async () => {
    await container.authUseCase.signOut();
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    await container.authUseCase.updatePassword(newPassword);
  }, []);

  const reauthenticate = useCallback(async (password: string) => {
    await container.authUseCase.reauthenticate(password);
  }, []);

  const getIdToken = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        resetPassword,
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
