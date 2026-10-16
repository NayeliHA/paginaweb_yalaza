import type { RegisteredUser } from "@/models";

const names = [
  ["Jesus Anderson", "Cuadros Yaranga"],
  ["Yusef", "Llallahui Huaraca"],
  ["Javier", "Chavez de la Cruz"],
  ["Brayan Steven", "Misaico Chavez"],
  ["Nayeli Rocio", "Herrera Albino"],
  ["Valeria", "Ramos Flores"],
  ["Diego", "Quispe Torres"],
  ["Camila", "Vargas Soto"],
  ["Luis Fernando", "Garcia Mendoza"],
  ["Luciana", "Castro Rojas"],
  ["Sebastian", "Huaman Salazar"],
  ["Fernanda", "Lopez Aguilar"],
  ["Mateo", "Paredes Silva"],
  ["Daniela", "Mamani Cruz"],
  ["Alejandro", "Reyes Navarro"],
  ["Andrea", "Diaz Palomino"],
  ["Gabriel", "Sanchez Perez"],
  ["Sofia", "Medina Campos"],
  ["Rodrigo", "Vega Alarcon"],
  ["Mariana", "Torres Valdez"],
];

export const demoCustomers: RegisteredUser[] = names.map(([name, lastName], index) => ({
  id: `demo-customer-${String(index + 1).padStart(2, "0")}`,
  role: "customer",
  name,
  lastName,
  age: 22 + index % 9,
  email: `cliente${String(index + 1).padStart(2, "0")}@yalaza.test`,
  phone: `90000${String(index + 1).padStart(4, "0")}`,
  password: "cliente123",
  createdAt: "2026-01-01T00:00:00.000Z",
}));

// Only insert missing records. Reloading never resets customers or their data.
export function seedDemoCustomers(users: RegisteredUser[]): RegisteredUser[] {
  return [
    ...users,
    ...demoCustomers.filter(seed => !users.some(user => user.id === seed.id || user.email === seed.email)),
  ];
}
