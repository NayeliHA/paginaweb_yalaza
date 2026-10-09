import type {
  AuthSession,
  LoginInput,
  RegisterCustomerInput,
  RegisteredUser,
} from "@/models";
import {
  getAuthSnapshot,
  saveAuthSession,
  saveAuthUsers,
} from "@/services/auth-state.service";

const seededUsers: RegisteredUser[] = [
  {
    id: "user-admin",
    role: "admin",
    name: "Administrador",
    lastName: "Yalaza",
    age: 25,
    email: "admin@yalaza.pe",
    phone: "999999991",
    password: "admin123",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-delivery",
    role: "delivery",
    name: "Delivery",
    lastName: "Yalaza",
    age: 25,
    email: "delivery@yalaza.pe",
    phone: "999999992",
    password: "delivery123",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("es");
}

function toSession(user: RegisteredUser): AuthSession {
  return {
    userId: user.id,
    role: user.role,
    name: user.name,
    lastName: user.lastName,
    email: user.email,
  };
}

function createUserId(): string {
  return `USR-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export class AuthFacade {
  getUsers(): RegisteredUser[] {
    const current = getAuthSnapshot().users;
    const customUsers = current.filter(
      (user) => !seededUsers.some((seeded) => seeded.id === user.id),
    );
    return [...seededUsers, ...customUsers];
  }

  registerCustomer(input: RegisterCustomerInput): AuthSession {
    const name = input.name.trim();
    const lastName = input.lastName.trim();
    const email = normalizeEmail(input.email);
    const phone = input.phone.replace(/\D/g, "");
    const password = input.password.trim();

    if (name.length < 2) throw new Error("Ingresa un nombre válido.");
    if (lastName.length < 2) throw new Error("Ingresa un apellido válido.");
    if (!Number.isInteger(input.age) || input.age < 13) {
      throw new Error("Ingresa una edad válida.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Ingresa un correo válido.");
    }
    if (!/^9\d{8}$/.test(phone)) {
      throw new Error("Ingresa un celular válido de 9 dígitos.");
    }
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    const users = this.getUsers();
    if (users.some((user) => user.email === email)) {
      throw new Error("Ese correo ya está registrado.");
    }

    const user: RegisteredUser = {
      id: createUserId(),
      role: "customer",
      name,
      lastName,
      age: input.age,
      email,
      phone,
      password,
      createdAt: new Date().toISOString(),
    };
    const customUsers = [...getAuthSnapshot().users, user].filter(
      (savedUser) => !seededUsers.some((seeded) => seeded.id === savedUser.id),
    );
    saveAuthUsers(customUsers);
    const session = toSession(user);
    saveAuthSession(session);
    return session;
  }

  login(input: LoginInput): AuthSession {
    const email = normalizeEmail(input.email);
    const user = this.getUsers().find(
      (item) =>
        item.email === email &&
        item.password === input.password &&
        item.role === input.role,
    );
    if (!user) {
      throw new Error("Correo, contraseña o rol incorrecto.");
    }
    const session = toSession(user);
    saveAuthSession(session);
    return session;
  }

  logout(): void {
    saveAuthSession(null);
  }
}

export const authFacade = new AuthFacade();
