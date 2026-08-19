"use client";
import { Star, Image as ImageIcon } from "lucide-react";
import { Product, effectivePrice, fmt } from "@/lib/types";

export default function ProductCard({
  product,
  primary,
  onOpen,
  onAdd,
}: {
  product: Product;
  primary: string;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const outOfStock = (product.stock ?? 1) <= 0;
  return (
    <div className="group cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 shadow-sm group-hover:shadow-md transition-shadow">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ImageIcon size={26} />
          </div>
        )}
        {product.destacado && (
          <span
            className="absolute top-2 left-2 bg-white/95 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ color: primary }}
          >
            <Star size={10} fill={primary} /> Destacado
          </span>
        )}
        {product.oferta && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            -{product.discount_pct}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[11px] font-medium text-neutral-600 bg-white px-2 py-1 rounded-full">
              Sin stock
            </span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium truncate">{product.name}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold" style={{ color: primary }}>
            ${fmt(effectivePrice(product))}
          </span>
          {product.oferta && (
            <span className="text-xs text-neutral-400 line-through">${fmt(product.price)}</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!outOfStock) onAdd();
        }}
        disabled={outOfStock}
        className="mt-1.5 w-full text-xs rounded-lg py-1.5 border font-medium transition-colors disabled:opacity-30"
        style={{ borderColor: primary, color: primary }}
      >
        Agregar
      </button>
    </div>
  );
}
