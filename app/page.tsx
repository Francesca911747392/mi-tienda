import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Sparkles size={28} className="mb-3 text-neutral-400" />
<h1 className="text-2xl font-semibold">Creá tu tienda online</h1>

      <p className="text-sm text-neutral-500 mt-2 max-w-xs">
        Cargá tus productos, personalizá los colores y vendé por WhatsApp. Sin comisiones.
      </p>
      <div className="flex gap-3 mt-6">
        <Link href="/registro" className="bg-neutral-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium">
          Crear mi tienda
        </Link>
        <Link href="/login" className="border border-neutral-200 rounded-lg px-5 py-2.5 text-sm font-medium">
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}
