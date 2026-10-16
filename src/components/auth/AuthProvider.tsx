"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AuthSession, LoginInput, RegisterCustomerInput, RegisteredUser } from "@/models";
import { authController } from "@/controllers/auth.controller";

interface AuthContextValue {
  customers: RegisteredUser[];
  session: AuthSession | null;
  hydrated: boolean;
  registerCustomer: (input: RegisterCustomerInput) => AuthSession;
  login: (input: LoginInput) => AuthSession;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, session, hydrated } = useSyncExternalStore(
    authController.subscribeToAuthState,
    authController.getAuthState,
    authController.getServerAuthState,
  );

  const value: AuthContextValue = {
    customers: users.filter(user => user.role === "customer"),
    session,
    hydrated,
    registerCustomer: authController.registerCustomer,
    login: authController.login,
    logout: authController.logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}
