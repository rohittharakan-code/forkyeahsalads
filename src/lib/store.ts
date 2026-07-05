import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, SaladItem, ProteinOption } from "./types";

interface CartStore {
  items: CartItem[];
  addItem: (salad: SaladItem, proteins: ProteinOption[], deliveryDate: string) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

function cartKey(item: CartItem): string {
  const proteinKey = item.selectedProteins.map((p) => p.name).sort().join(",");
  return `${item.salad.id}|${item.deliveryDate}|${proteinKey}`;
}

export function getCartKey(item: CartItem): string {
  return cartKey(item);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (salad, proteins, deliveryDate) =>
        set((state) => {
          const newItem: CartItem = { salad, quantity: 1, selectedProteins: proteins, deliveryDate };
          const key = cartKey(newItem);
          const existing = state.items.find((i) => cartKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => cartKey(i) !== key),
        })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => cartKey(i) !== key)
              : state.items.map((i) =>
                  cartKey(i) === key ? { ...i, quantity } : i
                ),
        })),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => {
          const proteinTotal = i.selectedProteins.reduce((s, p) => s + p.price, 0);
          return sum + (i.salad.price + proteinTotal) * i.quantity;
        }, 0),
    }),
    { name: "salad-co-cart" }
  )
);
