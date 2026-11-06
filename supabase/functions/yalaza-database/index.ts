// Server-to-server bridge. The browser never receives the gateway credential.
const expectedHash = "5aa3cdbe14acbc7630795c0b9071b46cf6acdd48306ef356bcf6780d46624060";
Deno.serve(async (request: Request) => {
  const secret = request.headers.get("x-yalaza-secret") || "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const actual = Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, "0")).join("");
  if (actual !== expectedHash || request.method !== "POST") return new Response("Unauthorized", { status: 401 });
  try {
    const body = await request.json();
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = async (path: string, init: RequestInit = {}) => {
      const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers } });
      if (!response.ok) throw new Error("Database unavailable");
      const value = await response.text(); return value ? JSON.parse(value) : null;
    };
    let value;
    if (body.operation === "read") {
      let rows = await db("yalaza_store?id=eq.1&select=revision,data");
      if (!rows.length && body.initial) {
        await db("yalaza_store?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ id: 1, revision: 0, data: body.initial }) });
        rows = await db("yalaza_store?id=eq.1&select=revision,data");
      }
      value = rows[0] || null;
    } else if (body.operation === "cas") {
      value = await db("rpc/yalaza_compare_and_swap", { method: "POST", body: JSON.stringify({ expected_revision: body.revision, next_data: body.data }) });
    } else return new Response("Invalid operation", { status: 400 });
    return Response.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Database unavailable" }, { status: 503 }); }
});
