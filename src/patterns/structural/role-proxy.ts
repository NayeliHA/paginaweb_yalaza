import type { AuthSession, UserRole } from "@/models";

export class RoleAccessProxy {
  constructor(private readonly session: AuthSession | null) {}

  canAccess(role: UserRole): boolean {
    return this.session?.role === role;
  }

  canAccessAny(roles: UserRole[]): boolean {
    return Boolean(this.session && roles.includes(this.session.role));
  }
}
