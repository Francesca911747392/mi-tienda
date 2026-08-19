"use client";
import { useEffect, useState } from "react";
import { Loader2, Upload, X, Pencil, Trash2, Image as ImageIcon, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product, StoreSettings, FONT_OPTIONS, effectivePrice, fmt } from "@/lib/types";

const COLOR_PRESETS = ["#1F6F6F", "#8A3E5A", "#B5722A", "#3E5C9A", "#5C4A9A", "#2F5D3A", "#9A2E2E", "#2B2B2B"];

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError("Email o contraseña incorrectos.");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} /> Cargando…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
          <h1 className="text-lg font-semibold">Ingresar al panel</h1>
          <p className="text-xs text-neutral-500">
            Usá el email y contraseña del usuario que creaste en Supabase Authentication.
          </p>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          {authError && <p className="text-xs text-red-500">{authError}</p>}
          <button type="submit" className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => supabase.auth.signOut()} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"productos" | "personalizacion">("productos");
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);

  async function loadAll() {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("store_settings").select("*").eq("id", 1).single(),
    ]);
    setProducts((p as Product[]) || []);
    setSettings((s as StoreSettings) || null);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveSettings(patch: Partial<StoreSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await supabase.from("store_settings").update(patch).eq("id", 1);
  }

  async function uploadImage(file: File) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("productos").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("productos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function deleteProduct(id: string) {
    await supabase.from("products").delete().eq("id", id);
    setProducts((list) => list.filter((p) => p.id !== id));
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} /> Cargando panel…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-neutral-100 rounded-full p-1 w-fit">
          {(["productos", "personalizacion"] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-full text-sm ${tab === id ? "bg-white shadow text-neutral-900" : "text-neutral-500"}`}
            >
              {id === "productos" ? "Productos" : "Personalización"}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700">
          <LogOut size={13} /> Salir
        </button>
      </div>

      {tab === "productos" ? (
        <ProductsTab
          products={products}
          setProducts={setProducts}
          editing={editing}
          setEditing={setEditing}
          primary={settings.primary_color}
          uploadImage={uploadImage}
          deleteProduct={deleteProduct}
        />
      ) : (
        <PersonalizationTab settings={settings} saveSettings={saveSettings} uploadImage={uploadImage} />
      )}
    </div>
  );
}

function ProductsTab({ products, setProducts, editing, setEditing, primary, uploadImage, deleteProduct }: any) {
  const blank = {
    id: "",
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "10",
    images: [] as string[],
    destacado: false,
    oferta: false,
    discount_pct: "",
  };
  const [form, setForm] = useState(blank);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        ...blank,
        ...editing,
        price: String(editing.price),
        stock: String(editing.stock ?? ""),
        discount_pct: String(editing.discount_pct || ""),
      });
    }
  }, [editing]);

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 3 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      alert("No se pudo subir la imagen. Revisá el bucket 'productos' en Supabase.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name,
      price: Number(form.price) || 0,
      description: form.description || null,
      category: form.category || null,
      stock: form.stock === "" ? null : Number(form.stock),
      images: form.images,
      destacado: form.destacado,
      oferta: form.oferta,
      discount_pct: form.discount_pct ? Number(form.discount_pct) : 0,
    };
    if (form.id) {
      const { data } = await supabase.from("products").update(payload).eq("id", form.id).select().single();
      setProducts((list: Product[]) => list.map((p) => (p.id === form.id ? (data as Product) : p)));
    } else {
      const { data } = await supabase.from("products").insert(payload).select().single();
      setProducts((list: Product[]) => [data as Product, ...list]);
    }
    setForm(blank);
    setEditing(null);
    setSaving(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={submit} className="space-y-3 bg-white border border-neutral-200 rounded-xl p-4">
        <h3 className="font-medium text-sm text-neutral-700">{form.id ? "Editar producto" : "Nuevo producto"}</h3>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Imágenes (hasta 3)</label>
          <div className="flex gap-2 flex-wrap">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                <img src={img} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {form.images.length < 3 && (
              
