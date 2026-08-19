export type Product = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  stock: number | null;
  images: string[];
  destacado: boolean;
  oferta: boolean;
  discount_pct: number | null;
  created_at?: string;
};

export type Store = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string;
  whatsapp: string;
  primary_color: string;
  font_id: string;
  logo_url: string | null;
};

export const FONT_OPTIONS = [
  { id: "serif", label: "Editorial", heading: "Georgia, 'Times New Roman', serif", body: "'Helvetica Neue', Arial, sans-serif" },
  { id: "modern", label: "Moderno", heading: "'Segoe UI', system-ui, sans-serif", body: "'Segoe UI', system-ui, sans-serif" },
  { id: "rounded", label: "Amigable", heading: "'Trebuchet MS', system-ui, sans-serif", body: "'Trebuchet MS', system-ui, sans-serif" },
  { id: "classic", label: "Clásico", heading: "'Palatino Linotype', Palatino, serif", body: "Georgia, serif" },
];

export function effectivePrice(p: Pick<Product, "price" | "oferta" | "discount_pct">) {
  if (p.oferta && p.discount_pct) return Math.round(p.price * (1 - p.discount_pct / 100));
  return p.price;
}

export function fmt(n: number) {
  return (Number(n) || 0).toLocaleString("es-AR");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
