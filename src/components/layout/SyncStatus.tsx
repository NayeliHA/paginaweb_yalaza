"use client";
import { useState } from "react";
import { refreshCloud, useCloudState } from "@/services/cloud-state.service";

const noticeClass = "fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg";

export function SyncStatus() {
  const { error, syncing } = useCloudState();
  if (error) return <ConnectionNotice key={error} message={error} />;
  if (!syncing) return null;
  return <div role="status" className={`${noticeClass} border-emerald-200 bg-emerald-50 text-emerald-900`}>Guardando cambios…</div>;
}

function ConnectionNotice({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <div role="status" className={`${noticeClass} border-red-200 bg-red-50 text-red-900`}>
    <p className="min-w-0 flex-1">{message}</p>
    <button type="button" onClick={() => void refreshCloud()} className="shrink-0 rounded px-2 py-1 font-semibold underline focus-visible:outline-2">Reintentar</button>
    <button type="button" aria-label="Cerrar aviso" onClick={() => setDismissed(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl hover:bg-red-100 focus-visible:outline-2">×</button>
  </div>;
}
