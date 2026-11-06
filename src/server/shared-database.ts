import { initialData, DomainError, type SharedData } from "./shared-domain";

async function gateway(body: unknown) {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.YALAZA_DATABASE_SECRET;
  if (!url || !secret) throw new DomainError("La base compartida todavía no está configurada en el servidor.", 503);
  const response = await fetch(`${url}/functions/v1/yalaza-database`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "x-yalaza-secret": secret }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new DomainError("No se pudo conectar con la base compartida. Intenta nuevamente.", 503);
  return response.json();
}

async function database(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new DomainError("La base compartida todavía no está configurada en el servidor.", 503);
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, cache: "no-store", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new DomainError("No se pudo conectar con la base compartida. Intenta nuevamente.", 503);
  const body = await response.text(); return body ? JSON.parse(body) : null;
}
export async function readStore(): Promise<{ revision: number; data: SharedData }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const row = await gateway({ operation: "read" });
    return row || gateway({ operation: "read", initial: initialData() });
  }
  let rows = await database("yalaza_store?id=eq.1&select=revision,data");
  if (!rows.length) {
    await database("yalaza_store?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ id: 1, revision: 0, data: initialData() }) });
    rows = await database("yalaza_store?id=eq.1&select=revision,data");
  }
  return rows[0];
}
export async function transact<T>(operation: (data: SharedData) => T): Promise<{ data: SharedData; result: T }> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const { revision, data } = await readStore();
    const result = operation(data);
    const committed = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await database("rpc/yalaza_compare_and_swap", { method: "POST", body: JSON.stringify({ expected_revision: revision, next_data: data }) })
      : await gateway({ operation: "cas", revision, data });
    if (committed) return { data, result };
  }
  throw new DomainError("Otro usuario está actualizando estos datos. Vuelve a intentarlo.", 409);
}
