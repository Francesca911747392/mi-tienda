"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/types";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr || !data.user) {
      setError(signErr?.message || "No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    let baseSlug = slugify(name) || "tienda";
    let slug = baseSlug;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    const { error: storeErr } = await supabase.from("stores").insert({
      owner_id: data.user.id,
      slug,
      name,
    });

    setLoading(false);

    if (storeErr) {
      setError("Tu cuenta se creó, pero hubo un problema armando la tienda: " + storeErr.message);
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
        <h1 className="text-lg font-semibold">Creá tu tienda</h1>
        <p className="text-xs text-neutral-500">
          Elegí un nombre, un email y una contraseña. Tu tienda se crea automáticamente.
        </p>
        <input
          required
          placeholder="Nombre de tu emprendimiento"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        <input
          required
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Creando…" : "Crear mi tienda"}
        </button>
        <p className="text-xs text-neutral-400 text-center">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="underline">
            Ingresá acá
          </a>
        </p>
      </form>
    </div>
  );
}
