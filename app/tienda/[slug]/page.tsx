"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, ShoppingCart, MessageCircle, Store as StoreIcon, Sparkles,
  Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, Check, Menu, Instagram, Music2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product, Store, FONT_OPTIONS, effectivePrice, fmt, trialExpired } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import CartDrawer, { CartLine } from "@/components/CartDrawer";

type CartState = Record<string, number>;

export default function TiendaPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [cart, setCart] = useState<CartState>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailIdx, setDetailIdx] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStore(s as Store);
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", (s as Store).id)
        .order("created_at", { ascending: false });
      setProducts((p as Product[]) || []);
      try {
        const saved = localStorage.getItem(`cart-${slug}`);
        if (saved) setCart(JSON.parse(saved));
      } catch (e) {}
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    try {
      localStorage.setItem(`cart-${slug}`, JSON.stringify(cart));
    } catch (e) {}
  }, [cart, slug]);

  function pushToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }

  const font = FONT_OPTIONS.find((f) => f.id === store?.font_id) || FONT_OPTIONS[0];
  const primary = store?.primary_color || "#1F6F6F";

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(products.map((p) => p.category || "General")))],
    [products]
  );

  const visible = products
    .filter((p) => (category === "Todas" ? true : (p.category || "General") === category))
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const cartItems: CartLine[] = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
    .filter((c) => c.product);
  const cartCount = cartItems.reduce((a, c) => a + c.qty, 0);

  function addToCart(product: Product) {
    if ((product.stock ?? 1) <= 0) return;
    setCart((c) => ({ ...c, [product.id]: (c[product.id] || 0) + 1 }));
    pushToast(`${product.name} agregado al carrito`);
  }

  function updateQty(id: string, delta: number) {
    setCart((c) => {
      const next = { ...c };
      const v = (next[id] || 0) + delta;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });
  }

  function removeFromCart(id: string) {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
    pushToast("Producto eliminado del carrito");
  }

  function checkout() {
    const digits = (store?.whatsapp || "").replace(/\D/g, "");
    if (!digits) {
      pushToast("La tienda todavía no cargó un WhatsApp de contacto");
      return;
    }
    const lines = cartItems.map(
      (c) => `• ${c.product.name} x${c.qty} — $${fmt(effectivePrice(c.product) * c.qty)}`
    );
    const total = cartItems.reduce((a, c) => a + c.qty * effectivePrice(c.product), 0);
    const msg = `Hola ${store?.name}! Quiero hacer este pedido:\n\n${lines.join("\n")}\n\nTotal: $${fmt(total)}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} />
        <span>Cargando tienda…</span>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm px-6 text-center">
        No encontramos esta tienda.
      </div>
    );
  }

  if (trialExpired(store)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-red-500 font-semibold text-lg mb-2">Esta tienda no está disponible</p>
          <p className="text-sm text-neutral-500">El dueño todavía no activó su suscripción.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font.body }}>
      <div className="relative px-6 py-12 text-center" style={{ background: `${primary}14` }}>
        <button
          onClick={() => setMenuOpen(true)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-neutral-600 hover:text-neutral-900"
          aria-label="Menú"
        >
          <Menu size={18} />
        </button>
        <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden bg-white shadow flex items-center justify-center">
          {store.logo_url ? (
            <img src={store.logo_url} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <Sparkles size={22} style={{ color: primary }} />
          )}
        </div>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: font.heading }}>
          {store.name}
        </h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">{store.description}</p>
      </div>

      <div className="px-4 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between max-w-5xl mx-auto">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos…"
            className="w-full border border-neutral-200 rounded-full pl-8 pr-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-3 py-1.5 rounded-full text-xs border transition-colors"
              style={
                category === c
                  ? { background: primary, borderColor: primary, color: "white" }
                  : { borderColor: "#E5E5E4", color: "#6B6866" }
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 px-6">
          <StoreIcon size={28} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Todavía no hay productos cargados.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 text-sm">
          No encontramos productos con ese filtro.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-4 pb-16 max-w-5xl mx-auto">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              primary={primary}
              onOpen={() => {
                setDetail(p);
                setDetailIdx(0);
              }}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>
      )}

      {store.whatsapp && (
        <a
          href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-white text-sm shadow-lg hover:opacity-90 transition"
          style={{ background: "#25D366" }}
        >
          <MessageCircle size={16} /> Consultar
        </a>
      )}

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-white text-sm shadow-lg"
        style={{ background: primary }}
      >
        <ShoppingCart size={16} />
        {cartCount > 0 && (
          <span
            className="bg-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center"
            style={{ color: primary }}
          >
            {cartCount}
          </span>
        )}
      </button>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={checkout}
        fontHeading={font.heading}
      />

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <button
              onClick={() => setDetail(null)}
              className="absolute top-3 right-3 z-10 bg-white/90 rounded-full p-1.5 text-neutral-500 hover:text-neutral-800"
            >
              <X size={16} />
            </button>
            <div className="relative w-full aspect-square bg-neutral-100">
              {detail.images?.length ? (
                <img src={detail.images[detailIdx]} alt={detail.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <ImageIcon size={40} />
                </div>
              )}
              {detail.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setDetailIdx((i) => (i - 1 + detail.images.length) % detail.images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setDetailIdx((i) => (i + 1) % detail.images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold" style={{ fontFamily: font.heading }}>
                {detail.name}
              </h3>
              {detail.description && <p className="text-sm text-neutral-500 mt-1">{detail.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xl font-semibold" style={{ color: primary }}>
                  ${fmt(effectivePrice(detail))}
                </span>
                {detail.oferta && (
                  <span className="text-sm text-neutral-400 line-through">${fmt(detail.price)}</span>
                )}
              </div>
              <button
                onClick={() => {
                  addToCart(detail);
                  setDetail(null);
                }}
                disabled={(detail.stock ?? 1) <= 0}
                className="mt-4 w-full rounded-xl py-3 text-white text-sm font-medium disabled:opacity-40"
                style={{ background: primary }}
              >
                {(detail.stock ?? 1) <= 0 ? "Sin stock" : "Agregar al carrito"}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative w-full max-w-xs bg-black text-white h-full shadow-2xl flex flex-col p-5">
            <button
              onClick={() => setMenuOpen(false)}
              className="self-end text-neutral-400 hover:text-white mb-4"
            >
              <X size={20} />
            </button>
            <div className="relative mb-6">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-full pl-8 pr-3 py-2 text-sm outline-none text-white placeholder:text-neutral-500"
              />
            </div>
            <nav className="space-y-4 text-sm">
              <button
                onClick={() => {
                  setCategory("Todas");
                  setMenuOpen(false);
                }}
                className="block text-left w-full hover:opacity-70"
              >
                Inicio
              </button>
              {categories
                .filter((c) => c !== "Todas")
                .map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setMenuOpen(false);
                    }}
                    className="block text-left w-full hover:opacity-70"
                  >
                    {c}
                  </button>
                ))}
              <Link
                href={`/tienda/${slug}/quienes-somos`}
                className="block hover:opacity-70"
                onClick={() => setMenuOpen(false)}
              >
                Quiénes Somos
              </Link>
              {store.whatsapp && (
                <a
                  href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:opacity-70"
                >
                  Contacto
                </a>
              )}
            </nav>
            {(store.instagram_url || store.tiktok_url) && (
              <div className="flex gap-3 mt-8">
                {store.instagram_url && (
                  <a
                    href={`https://instagram.com/${store.instagram_url.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full border border-neutral-700 flex items-center justify-center hover:border-white"
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {store.tiktok_url && (
                  <a
                    href={`https://tiktok.com/@${store.tiktok_url.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full border border-neutral-700 flex items-center justify-center hover:border-white"
                  >
                    <Music2 size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 py-10 px-6 text-center text-sm" style={{ background: "#1c1c1c", color: "#c9c9c9" }}>
        {store.logo_url && (
          <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-full object-cover mx-auto mb-4" />
        )}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          <button onClick={() => setCategory("Todas")} className="hover:text-white">
            Inicio
          </button>
          {categories
            .filter((c) => c !== "Todas")
            .slice(0, 4)
            .map((c) => (
              <button key={c} onClick={() => setCategory(c)} className="hover:text-white">
                {c}
              </button>
            ))}
          <Link href={`/tienda/${slug}/quienes-somos`} className="hover:text-white">
            Quiénes Somos
          </Link>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              Contacto
            </a>
          )}
        </div>
        {(store.instagram_url || store.tiktok_url) && (
          <div className="flex justify-center gap-3 mb-6">
            {store.instagram_url && (
              <a
                href={`https://instagram.com/${store.instagram_url.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-neutral-600 flex items-center justify-center hover:border-white hover:text-white"
              >
                <Instagram size={16} />
              </a>
            )}
            {store.tiktok_url && (
              <a
                href={`https://tiktok.com/@${store.tiktok_url.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-neutral-600 flex items-center justify-center hover:border-white hover:text-white"
              >
                <Music2 size={16} />
              </a>
            )}
          </div>
        )}
        <p className="text-xs opacity-70">
          {store.name} — {new Date().getFullYear()}. Todos los derechos reservados.
        </p>
      </footer>

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            style={{ animation: "fadeIn 0.2s ease" }}
          >
            <Check size={14} /> {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
