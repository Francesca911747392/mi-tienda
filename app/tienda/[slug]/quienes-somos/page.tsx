"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Store, FONT_OPTIONS, trialExpired } from "@/lib/types";

export default function QuienesSomosPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStore(s as Store);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} />
        <span>Cargando…</span>
      </div>
    );
  }

  if (notFound || !store || trialExpired(store)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm px-6 text-center">
        No encontramos esta página.
      </div>
    );
  }

  const font = FONT_OPTIONS.find((f) => f.id === store.font_id) || FONT_OPTIONS[0];
  const primary = store.primary_color || "#1F6F6F";

  return (
    <div style={{ fontFamily: font.body }} className="min-h-screen">
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/tienda/${slug}`)}
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 mb-6"
        >
          <ChevronLeft size={16} /> Volver a la tienda
        </button>

        <h1 className="text-2xl font-semibold mb-6 text-center" style={{ fontFamily: font.heading }}>
          Quiénes somos
        </h1>

        {store.about_image_url ? (
          <img
            src={store.about_image_url}
            alt={store.name}
            className="w-full aspect-video object-cover rounded-2xl mb-6"
          />
        ) : (
          <div
            className="w-full aspect-video rounded-2xl mb-6 flex items-center justify-center"
            style={{ background: `${primary}14` }}
          >
            <Sparkles size={28} style={{ color: primary }} />
          </div>
        )}

        <h2 className="text-lg font-medium mb-2" style={{ fontFamily: font.heading }}>
          {store.name}
        </h2>

        {store.about_text ? (
          <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{store.about_text}</p>
        ) : (
          <p className="text-sm text-neutral-400">Todavía no cargamos esta información.</p>
        )}
      </div>
    </div>
  );
}
