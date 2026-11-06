"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { AuthSession, LoginInput, RegisterCustomerInput, RegisteredUser } from "@/models";
import { cloudCommand, useCloudState } from "@/services/cloud-state.service";

interface AuthContextValue {
  customers: RegisteredUser[];
  session: AuthSession | null;
  hydrated: boolean;
  registerCustomer: (input: RegisterCustomerInput) => Promise<AuthSession>;
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, session, hydrated } = useCloudState();

  const value: AuthContextValue = {
    customers: users.filter(user => user.role === "customer"),
    session,
    hydrated,
    registerCustomer: input => cloudCommand<AuthSession>("register", input),
    login: input => cloudCommand<AuthSession>("login", input),
    logout: () => cloudCommand("logout"),
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
