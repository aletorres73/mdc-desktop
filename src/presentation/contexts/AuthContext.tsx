import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { authUseCase, userRepository } from "@/di/container";
import type { AppUser, UserModel } from "@/domain/entities/user";

interface AuthContextValue {
  appUser: AppUser | null;
  userProfile: UserModel | null;
  loading: boolean;
  isSubscriptionActive: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const profile = await userRepository.getUser(uid);
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = authUseCase.onAuthStateChanged(async (user) => {
      setAppUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (appUser) await loadProfile(appUser.uid);
  };

  const signOut = async () => {
    await authUseCase.signOut();
  };

  const isSubscriptionActive = authUseCase.isSubscriptionActive(userProfile);

  return (
    <AuthContext.Provider value={{ appUser, userProfile, loading, isSubscriptionActive, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
