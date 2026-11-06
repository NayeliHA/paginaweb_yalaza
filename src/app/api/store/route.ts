import { NextRequest, NextResponse } from "next/server";
import { readStore, transact } from "@/server/shared-database";
import { DomainError, executeCommand, publicSnapshot, type Command } from "@/server/shared-domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };
const token = (request: NextRequest) => request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof DomainError ? error.message : "No se pudo completar la operación. Vuelve a intentarlo." }, { status: error instanceof DomainError ? error.status : 500, headers });
}
export async function GET(request: NextRequest) {
  try { const { data } = await readStore(); return NextResponse.json(publicSnapshot(data, token(request)), { headers }); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) throw new DomainError("Origen no permitido.", 403);
    const body = await request.text();
    if (body.length > 50000) throw new DomainError("La solicitud es demasiado grande.", 413);
    const command = JSON.parse(body) as Command;
    if (!command || typeof command.action !== "string" || (command.args !== undefined && !Array.isArray(command.args))) throw new DomainError("Solicitud inválida.");
    const bearer = token(request);
    const { data, result } = await transact(data => executeCommand(data, bearer, command));
    return NextResponse.json({ ...result, snapshot: publicSnapshot(data, result.token ?? bearer) }, { headers });
  } catch (error) { return failure(error); }
}
