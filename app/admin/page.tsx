"use client";
import { useEffect, useState } from "react";
import { Loader2, Upload, X, Pencil, Trash2, Image as ImageIcon, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product, Store, FONT_OPTIONS, effectivePrice, fmt, slugify } from "@/lib/types";

const COLOR_PRESETS = ["#1F6F6F", "#8A3E5A", "#B5722A", "#3E5C9A", "#5C4A9A", "#2F5D3A", "#9A2E2E", "#2B2B2B"];

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} /> Cargando…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-sm text-neutral-500 mb-3">Tenés que ingresar para ver tu panel.</p>
          <a href="/login" className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm font-medium">
            Ingresar
          </a>
        </div>
      </div>
    );
  }

  return <AdminDashboard userId={session.user.id} onLogout={() => supabase.auth.signOut()} />;
}

function AdminDashboard({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"productos" | "personalizacion">("productos");
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creatingName, setCreatingName] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadAll() {
    const { data: s } = await supabase.from("stores").select("*").eq("owner_id", userId).maybeSingle();
    setStore((s as Store) || null);
    if (s) {
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", (s as Store).id)
        .order("created_at", { ascending: false });
      setProducts((p as Product[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    if (!creatingName.trim()) return;
    setCreating(true);
    let baseSlug = slugify(creatingName) || "tienda";
    let slug = baseSlug;
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    const { data, error } = await supabase
      .from("stores")
      .insert({ owner_id: userId, slug, name: creatingName })
      .select()
      .single();
    setCreating(false);
    if (!error) setStore(data as Store);
  }

  async function saveSettings(patch: Partial<Store>) {
    if (!store) return;
    const next = { ...store, ...patch };
    setStore(next);
    await supabase.from("stores").update(patch).eq("id", store.id);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 gap-2">
        <Loader2 className="animate-spin" size={18} /> Cargando panel…
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={createStore} className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 space-y-3">
          <h1 className="text-lg font-semibold">Creá tu tienda</h1>
          <p className="text-xs text-neutral-500">Elegí el nombre de tu emprendimiento para empezar.</p>
          <input
            required
            placeholder="Nombre de tu emprendimiento"
            value={creatingName}
            onChange={(e) => setCreatingName(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {creating ? "Creando…" : "Crear tienda"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
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

      <a
        href={`/tienda/${store.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 mb-4"
      >
        Ver mi tienda pública <ExternalLink size={12} />
      </a>

      {tab === "productos" ? (
        <ProductsTab
          products={products}
          setProducts={setProducts}
          editing={editing}
          setEditing={setEditing}
          primary={store.primary_color}
          storeId={store.id}
          uploadImage={uploadImage}
          deleteProduct={deleteProduct}
        />
      ) : (
        <PersonalizationTab store={store} saveSettings={saveSettings} uploadImage={uploadImage} />
      )}
    </div>
  );
}

function ProductsTab({ products, setProducts, editing, setEditing, primary, storeId, uploadImage, deleteProduct }: any) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      store_id: storeId,
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
              <label className="w-16 h-16 rounded-lg border border-dashed border-neutral-300 flex items-center justify-center cursor-pointer text-neutral-400 hover:border-neutral-400">
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            )}
          </div>
        </div>
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
        <div className="flex gap-2">
          <input required type="number" placeholder="Precio" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
          <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
        </div>
        <input placeholder="Categoría (opcional)" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400" />
        <textarea placeholder="Descripción (opcional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400 resize-none" />
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.destacado} onChange={(e) => setForm((f) => ({ ...f, destacado: e.target.checked }))} /> Destacado
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={form.oferta} onChange={(e) => setForm((f) => ({ ...f, oferta: e.target.checked }))} /> Oferta
          </label>
          {form.oferta && (
            <input
              type="number"
              placeholder="% off"
              value={form.discount_pct}
              onChange={(e) => setForm((f) => ({ ...f, discount_pct: e.target.value }))}
              className="w-20 border border-neutral-200 rounded-lg px-2 py-1 text-sm outline-none"
            />
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving} className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: primary }}>
            {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Agregar producto"}
          </button>
          {form.id && (
            <button type="button" onClick={() => { setForm(blank); setEditing(null); }} className="px-3 rounded-lg border border-neutral-200 text-sm">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-medium text-sm text-neutral-700 mb-1">Catálogo ({products.length})</h3>
        {products.length === 0 && <p className="text-sm text-neutral-400">Sin productos todavía.</p>}
        {products.map((p: Product) => (
          <div key={p.id} className="flex items-center gap-3 border border-neutral-200 rounded-lg p-2">
            <div className="w-11 h-11 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0">
              {p.images?.[0] ? (
                <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <ImageIcon size={14} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.name}</div>
              <div className="text-xs text-neutral-400">
                ${fmt(effectivePrice(p))} · stock {p.stock ?? "-"}
              </div>
            </div>
            <button onClick={() => setEditing(p)} className="text-neutral-400 hover:text-neutral-700">
              <Pencil size={14} />
            </button>
            <button onClick={() => deleteProduct(p.id)} className="text-neutral-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalizationTab({ store, saveSettings, uploadImage }: any) {
  const [local, setLocal] = useState(store);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setLocal((s: Store) => ({ ...s, logo_url: url }));
      saveSettings({ logo_url: url });
    } catch (err) {
      alert("No se pudo subir el logo.");
    }
  }

  function commit(patch: Partial<Store>) {
    setLocal((s: Store) => ({ ...s, ...patch }));
    saveSettings(patch);
  }

  return (
    <div className="max-w-md space-y-5 bg-white border border-neutral-200 rounded-xl p-5">
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Link de tu tienda</label>
        <p className="text-sm text-neutral-700 break-all">/tienda/{local.slug}</p>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Logo</label>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center">
            {local.logo_url ? (
              <img src={local.logo_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <ImageIcon size={16} className="text-neutral-300" />
            )}
          </div>
          <label className="text-xs border border-neutral-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-neutral-50">
            Subir imagen
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </label>
        </div>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Nombre del emprendimiento</label>
        <input
          value={local.name}
          onChange={(e) => setLocal((s: Store) => ({ ...s, name: e.target.value }))}
          onBlur={(e) => commit({ name: e.target.value })}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Descripción corta</label>
        <input
          value={local.description}
          onChange={(e) => setLocal((s: Store) => ({ ...s, description: e.target.value }))}
          onBlur={(e) => commit({ description: e.target.value })}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">WhatsApp (con código de país, solo números)</label>
        <input
          value={local.whatsapp}
          onChange={(e) => setLocal((s: Store) => ({ ...s, whatsapp: e.target.value }))}
          onBlur={(e) => commit({ whatsapp: e.target.value })}
          placeholder="5492235551234"
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Color principal</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => commit({ primary_color: c })}
              className="w-7 h-7 rounded-full border-2"
              style={{ background: c, borderColor: local.primary_color === c ? "#232120" : "transparent" }}
            />
          ))}
          <input
            type="color"
            value={local.primary_color}
            onChange={(e) => commit({ primary_color: e.target.value })}
            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Tipografía</label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => commit({ font_id: f.id })}
              className="border rounded-lg px-3 py-2 text-left"
              style={{ fontFamily: f.heading, borderColor: local.font_id === f.id ? local.primary_color : "#E5E5E4" }}
            >
              <div className="text-sm">{local.name || "Aa"}</div>
              <div className="text-[10px] text-neutral-400" style={{ fontFamily: "system-ui" }}>
                {f.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
