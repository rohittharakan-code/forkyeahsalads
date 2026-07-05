import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, SaladItem } from "./types";

interface CartStore {
  items: CartItem[];
  addItem: (salad: SaladItem) => void;
  removeItem: (saladId: string) => void;
  updateQuantity: (saladId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (salad) =>
        set((state) => {
          const existing = state.items.find((i) => i.salad.id === salad.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.salad.id === salad.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { salad, quantity: 1 }] };
        }),
      removeItem: (saladId) =>
        set((state) => ({
          items: state.items.filter((i) => i.salad.id !== saladId),
        })),
      updateQuantity: (saladId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.salad.id !== saladId)
              : state.items.map((i) =>
                  i.salad.id === saladId ? { ...i, quantity } : i
                ),
        })),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.salad.price * i.quantity, 0),
    }),
    { name: "salad-co-cart" }
  )
);
