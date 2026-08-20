"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
        <h1 className="text-lg font-semibold">Ingresar a mi tienda</h1>
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
        <button type="submit" className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium">
          Ingresar
        </button>
        <p className="text-xs text-neutral-400 text-center">
          ¿No tenés tienda todavía?{" "}
          <a href="/registro" className="underline">
            Creala acá
          </a>
        </p>
      </form>
    </div>
  );
}
