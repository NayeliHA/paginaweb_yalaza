import type { AuthSession, RegisteredUser } from "@/models";

export interface AuthRepository {
  loadUsers(): RegisteredUser[];
  saveUsers(users: RegisteredUser[]): void;
  loadSession(): AuthSession | null;
  saveSession(session: AuthSession | null): void;
}

const USERS_KEY = "yalaza:users:v1";
const SESSION_KEY = "yalaza:session:v1";

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function isRegisteredUser(value: unknown): value is RegisteredUser {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Partial<RegisteredUser>;
  return (
    typeof user.id === "string" &&
    (user.role === "admin" ||
      user.role === "delivery" ||
      user.role === "customer") &&
    typeof user.email === "string" &&
    typeof user.password === "string"
  );
}

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.userId === "string" &&
    (session.role === "admin" ||
      session.role === "delivery" ||
      session.role === "customer") &&
    typeof session.email === "string"
  );
}

export class LocalStorageAuthRepository implements AuthRepository {
  loadUsers(): RegisteredUser[] {
    const stored = readJson(USERS_KEY);
    return Array.isArray(stored) ? stored.filter(isRegisteredUser) : [];
  }

  saveUsers(users: RegisteredUser[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  loadSession(): AuthSession | null {
    const stored = readJson(SESSION_KEY);
    return isAuthSession(stored) ? stored : null;
  }

  saveSession(session: AuthSession | null): void {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return;
    }
    localStorage.removeItem(SESSION_KEY);
  }
}

export const authRepository: AuthRepository = new LocalStorageAuthRepository();
