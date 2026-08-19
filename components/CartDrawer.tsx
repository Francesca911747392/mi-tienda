"use client";
import { X, Minus, Plus, Trash2, MessageCircle, Image as ImageIcon } from "lucide-react";
import { Product, effectivePrice, fmt } from "@/lib/types";

export type CartLine = { product: Product; qty: number };

export default function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemove,
  onCheckout,
  fontHeading,
}: {
  open: boolean;
  onClose: () => void;
  items: CartLine[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  fontHeading: string;
}) {
  if (!open) return null;
  const total = items.reduce((a, c) => a + c.qty * effectivePrice(c.product), 0);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <h3 className="font-semibold" style={{ fontFamily: fontHeading }}>
            Tu carrito
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-neutral-400 text-center mt-10">
              Todavía no agregaste productos.
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="text-xs text-neutral-400">${fmt(effectivePrice(product))} c/u</div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => onUpdateQty(product.id, -1)}
                      className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center">{qty}</span>
                    <button
                      onClick={() => onUpdateQty(product.id, 1)}
                      className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button onClick={() => onRemove(product.id)} className="text-neutral-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-neutral-200 px-4 py-4 space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span>${fmt(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-white text-sm font-medium disabled:opacity-40"
            style={{ background: "#25D366" }}
          >
            <MessageCircle size={16} /> Finalizar pedido por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
