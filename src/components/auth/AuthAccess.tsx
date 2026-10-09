"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/models";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/ui/Container";

const roleOptions: { role: UserRole; label: string; hint: string }[] = [
  { role: "customer", label: "Cliente", hint: "Comprar y ver mis pedidos" },
  { role: "delivery", label: "Delivery", hint: "Tomar pedidos de reparto" },
  { role: "admin", label: "Administrador", hint: "Ver y verificar recojos" },
];

const redirects: Record<UserRole, string> = {
  admin: "/admin",
  delivery: "/delivery",
  customer: "/cliente",
};

export function AuthAccess() {
  const router = useRouter();
  const { login, registerCustomer } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const session =
        mode === "register"
          ? registerCustomer({
              name,
              lastName,
              age: Number(age),
              email,
              phone,
              password,
            })
          : login({ role, email, password });
      router.push(redirects[session.role]);
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "No se pudo completar el acceso.",
      );
    }
  }

  function selectMode(nextMode: "login" | "register") {
    setMode(nextMode);
    if (nextMode === "register") setRole("customer");
    setError("");
  }

  return (
    <section className="relative overflow-hidden py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,201,93,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,77,26,0.2),transparent_32%)]" />
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
              Acceso Yalaza
            </p>
            <h1 className="mt-3 font-display text-6xl leading-none text-cream sm:text-7xl">
              Entra a tu apartado
            </h1>
            <p className="mt-5 max-w-lg text-muted">
              Registra clientes, toma pedidos de delivery y verifica recojos con
              un código de 4 dígitos.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {roleOptions.map((option) => (
                <div
                  key={option.role}
                  className="border border-cream/10 bg-card/80 p-4 transition hover:-translate-y-0.5 hover:border-ember/50"
                >
                  <p className="font-display text-3xl text-cream">
                    {option.label}
                  </p>
                  <p className="mt-1 text-sm text-muted">{option.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border border-cream/10 bg-card p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-7"
          >
            <div className="grid grid-cols-2 gap-2 rounded-full bg-ink p-1">
              <button
                type="button"
                onClick={() => selectMode("register")}
                className={`rounded-full px-4 py-3 text-sm font-bold uppercase transition ${
                  mode === "register"
                    ? "bg-ember text-ink"
                    : "text-muted hover:text-cream"
                }`}
              >
                Registrar cliente
              </button>
              <button
                type="button"
                onClick={() => selectMode("login")}
                className={`rounded-full px-4 py-3 text-sm font-bold uppercase transition ${
                  mode === "login"
                    ? "bg-ember text-ink"
                    : "text-muted hover:text-cream"
                }`}
              >
                Iniciar sesión
              </button>
            </div>

            {mode === "login" ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {roleOptions.map((option) => (
                  <label
                    key={option.role}
                    className={`cursor-pointer border px-4 py-3 text-center text-xs font-bold uppercase transition ${
                      role === option.role
                        ? "border-ember bg-ember/10 text-cream"
                        : "border-cream/15 text-muted hover:border-cream/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.role}
                      checked={role === option.role}
                      onChange={() => setRole(option.role)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            ) : null}

            {mode === "register" ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input label="Nombre" value={name} onChange={setName} />
                <Input label="Apellido" value={lastName} onChange={setLastName} />
                <Input
                  label="Edad"
                  type="number"
                  value={age}
                  onChange={setAge}
                  min={13}
                />
                <Input
                  label="Celular"
                  type="tel"
                  value={phone}
                  onChange={(value) => setPhone(value.replace(/\D/g, ""))}
                  maxLength={9}
                />
              </div>
            ) : null}

            <div className="mt-4 grid gap-4">
              <Input
                label="Correo"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
            </div>

            {mode === "login" ? (
              <p className="mt-4 rounded-lg border border-cream/10 bg-ink px-4 py-3 text-xs leading-5 text-muted">
                Accesos de prueba: admin@yalaza.pe / admin123 y
                delivery@yalaza.pe / delivery123.
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm font-semibold text-flame" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-ember px-6 py-3 text-sm font-bold uppercase text-ink transition hover:bg-flame"
            >
              {mode === "register" ? "Crear cuenta" : "Entrar"}
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
} & Omit<ComponentProps<"input">, "onChange" | "value" | "type">) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-muted">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-cream/15 bg-ink px-4 py-3 text-cream outline-none transition placeholder:text-muted/70 focus:border-ember"
        {...props}
      />
    </label>
  );
}
