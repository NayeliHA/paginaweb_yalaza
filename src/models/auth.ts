export type UserRole = "admin" | "delivery" | "customer";

export interface RegisteredUser {
  id: string;
  role: UserRole;
  name: string;
  lastName: string;
  age: number;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  lastName: string;
  email: string;
}

export interface RegisterCustomerInput {
  name: string;
  lastName: string;
  age: number;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  role: UserRole;
  email: string;
  password: string;
}
