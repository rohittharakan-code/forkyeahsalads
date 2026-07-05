"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store";
import { SaladCard } from "@/components/salad-card";
import type { SaladItem } from "@/lib/types";
import { Search } from "lucide-react";

export default function MenuPage() {
  const [salads, setSalads] = useState<SaladItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  // Fetch salads
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("salad_items")
        .select("*")
        .eq("available", true)
        .order("category")
        .order("name");

      setSalads(data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  // Derive categories
  const categories = useMemo(() => {
    const unique = Array.from(new Set(salads.map((s) => s.category)));
    return ["All", ...unique];
  }, [salads]);

  // Filtered list
  const filtered = useMemo(() => {
    return salads.filter((s) => {
      const matchesCategory =
        activeCategory === "All" || s.category === activeCategory;
      const matchesSearch = s.name
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [salads, activeCategory, search]);

  // Add to cart handler
  function handleAdd(salad: SaladItem) {
    addItem(salad);
    setToast("Added to cart!");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-forest tracking-tight">
        Our Menu
      </h1>
      <p className="mt-1 text-muted text-sm">
        Browse our selection of fresh, hand-crafted salads.
      </p>

      {/* Search + Filters */}
      <div className="mt-8 flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
          <input
            type="text"
            placeholder="Search salads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-black/6 bg-white py-2.5 pl-9 pr-3 text-sm text-forest placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category pills */}
        {!loading && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white text-muted border border-black/6 hover:border-sage"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Salad list */}
      <div className="mt-8">
        {loading ? (
          /* Skeleton cards */
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[14px] border border-black/6 bg-cream p-3.5 flex items-start gap-3"
              >
                <div className="w-[72px] h-[72px] rounded-xl bg-mint flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/3 rounded bg-mint" />
                  <div className="h-2.5 w-full rounded bg-mint/60" />
                  <div className="h-3.5 w-1/3 rounded bg-mint mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-lg font-medium text-forest">
              No salads available yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Check back soon for new additions!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((salad) => (
              <SaladCard
                key={salad.id}
                salad={salad}
                onAddToCart={() => handleAdd(salad)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}
