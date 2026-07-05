"use client";

import { useCartStore, getCartKey } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.total);

  const subtotal = total();
  const deliveryFee: number = 0;
  const grandTotal = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4">
        <ShoppingBag className="w-16 h-16 text-sage" />
        <h1 className="font-display text-2xl font-semibold text-forest">
          Your cart is empty
        </h1>
        <p className="text-muted text-sm">
          Looks like you haven&apos;t added any salads yet.
        </p>
        <Link
          href="/menu"
          className="bg-primary text-white px-6 py-3.5 rounded-[14px] font-semibold text-[15px] hover:bg-primary/90 transition-colors"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32">
      <h2 className="font-display text-sm font-semibold text-forest mb-3">
        Items
      </h2>

      <div className="space-y-3">
        {items.map((item) => {
          const key = getCartKey(item);
          const proteinTotal = item.selectedProteins.reduce((s, p) => s + p.price, 0);
          const lineTotal = (item.salad.price + proteinTotal) * item.quantity;

          return (
            <div
              key={key}
              className="bg-white rounded-[14px] p-4 border border-black/[0.06]"
            >
              {/* Delivery date badge */}
              <div className="mb-2">
                <span className="inline-block bg-mint text-primary text-[11px] font-medium px-2.5 py-1 rounded-full">
                  {formatDate(item.deliveryDate)}
                </span>
              </div>

              {/* Top row: name + price */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-cream">
                    <Image
                      src={item.salad.image_url}
                      alt={item.salad.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-forest truncate">
                      {item.salad.name}
                    </h3>
                    {item.selectedProteins.length > 0 && (
                      <p className="text-[11px] text-muted mt-0.5">
                        + {item.selectedProteins.map((p) => p.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-display text-sm font-semibold text-primary flex-shrink-0">
                  ₹{lineTotal.toFixed(0)}
                </p>
              </div>

              {/* Bottom row: quantity stepper + remove */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-forest hover:bg-sage/30 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center font-display text-sm font-semibold text-forest">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-forest hover:bg-sage/30 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(key)}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                  aria-label={`Remove ${item.salad.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/menu"
        className="mt-3 flex items-center justify-center gap-2 w-full border-[1.5px] border-dashed border-primary/30 rounded-xl py-3.5 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add more items
      </Link>

      <div className="mt-6 pt-5 border-t border-black/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Subtotal</span>
          <span className="text-[13px] text-forest">₹{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">Delivery Fee</span>
          <span className="text-[13px] text-forest">
            {deliveryFee === 0 ? "Free" : `₹${deliveryFee.toFixed(0)}`}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-[15px] font-bold text-forest">Total</span>
          <span className="font-display text-[15px] font-bold text-forest">
            ₹{grandTotal.toFixed(0)}
          </span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full bg-primary rounded-[14px] py-4 text-center text-[15px] font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
