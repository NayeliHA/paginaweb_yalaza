import type { AuthSession, RegisteredUser } from "@/models";
import { authRepository } from "@/repositories/auth.repository";

export interface AuthState {
  users: RegisteredUser[];
  session: AuthSession | null;
  hydrated: boolean;
}

const serverState: AuthState = {
  users: [],
  session: null,
  hydrated: false,
};

let state = serverState;
let initialized = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function loadFromStorage(): void {
  state = {
    users: authRepository.loadUsers(),
    session: authRepository.loadSession(),
    hydrated: true,
  };
  initialized = true;
}

function handleStorageChange(): void {
  loadFromStorage();
  notify();
}

export function getAuthSnapshot(): AuthState {
  return state;
}

export function getServerAuthSnapshot(): AuthState {
  return serverState;
}

export function subscribeToAuthState(listener: () => void): () => void {
  if (typeof window !== "undefined" && !initialized) loadFromStorage();
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageChange);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

export function saveAuthUsers(users: RegisteredUser[]): void {
  authRepository.saveUsers(users);
  state = { ...state, users, hydrated: true };
  initialized = true;
  notify();
}

export function saveAuthSession(session: AuthSession | null): void {
  authRepository.saveSession(session);
  state = { ...state, session, hydrated: true };
  initialized = true;
  notify();
}
