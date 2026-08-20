"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function InvitacionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code === process.env.NEXT_PUBLIC_ACCESS_CODE) {
      document.cookie = "acceso_ok=1; path=/; max-age=" + 60 * 60 * 24 * 30;
      router.push(params.get("from") || "/");
    } else {
      setError("Código incorrecto.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
      <h1 className="text-lg font-semibold">Acceso privado</h1>
      <p className="text-xs text-neutral-500">Este sitio todavía está en pruebas. Pedí el código de acceso.</p>
      <input
        required
        placeholder="Código de acceso"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="submit" className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium">
        Entrar
      </button>
    </form>
  );
}

export default function InvitacionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <InvitacionForm />
      </Suspense>
    </div>
  );
}
