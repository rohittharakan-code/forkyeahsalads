"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store";
import type { SaladItem, ProteinOption } from "@/lib/types";
import Image from "next/image";
import { Loader2, Clock, CalendarDays } from "lucide-react";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  return d.toDateString() === today.toDateString();
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr + "T00:00:00");
  return d.toDateString() === tomorrow.toDateString();
}

function getDayLabel(dateStr: string): string {
  if (isToday(dateStr)) return "Today";
  if (isTomorrow(dateStr)) return "Tomorrow";
  return formatDate(dateStr);
}

function isCutoffPassed(dateStr: string): boolean {
  const now = new Date();
  const orderDate = new Date(dateStr + "T00:00:00");

  if (isToday(dateStr)) return true;

  const cutoff = new Date(orderDate);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(18, 0, 0, 0);

  return now >= cutoff;
}

export default function MenuPage() {
  const [salads, setSalads] = useState<SaladItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("salad_items")
        .select("*")
        .gte("available_date", today)
        .order("available_date", { ascending: true });

      setSalads(data ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (salads.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-forest">Our Menu</h1>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays className="w-12 h-12 text-sage mb-4" />
          <p className="font-display text-lg font-medium text-forest">
            No upcoming menu yet
          </p>
          <p className="mt-1 text-sm text-muted">
            Check back soon — we update our menu every few days!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-forest tracking-tight">
        Our Menu
      </h1>
      <p className="mt-1 text-muted text-sm">
        One fresh salad per day. Order before 6 PM the day before.
      </p>

      <div className="mt-8 space-y-6">
        {salads.map((salad) => (
          <DayCard
            key={salad.id}
            salad={salad}
            onAdd={(proteins) => {
              addItem(salad, proteins, salad.available_date);
              setToast("Added to cart!");
              setTimeout(() => setToast(null), 2000);
            }}
          />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

function DayCard({
  salad,
  onAdd,
}: {
  salad: SaladItem;
  onAdd: (proteins: ProteinOption[]) => void;
}) {
  const [selectedProteins, setSelectedProteins] = useState<ProteinOption[]>([]);
  const cutoffPassed = isCutoffPassed(salad.available_date);

  function toggleProtein(protein: ProteinOption) {
    setSelectedProteins((prev) => {
      const exists = prev.find((p) => p.name === protein.name);
      if (exists) return prev.filter((p) => p.name !== protein.name);
      return [...prev, protein];
    });
  }

  const basePrice = salad.price;
  const proteinTotal = selectedProteins.reduce((s, p) => s + p.price, 0);
  const itemTotal = basePrice + proteinTotal;

  return (
    <div className={`bg-white rounded-[14px] border border-black/[0.06] overflow-hidden ${cutoffPassed ? "opacity-60" : ""}`}>
      {/* Day header */}
      <div className="bg-mint/40 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="font-display text-sm font-semibold text-forest">
            {getDayLabel(salad.available_date)}
          </span>
          <span className="text-xs text-muted">
            {formatDate(salad.available_date)}
          </span>
        </div>
        {cutoffPassed && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="w-3 h-3" />
            Ordering closed
          </span>
        )}
        {!cutoffPassed && (
          <span className="text-xs text-primary font-medium">
            Order by 6 PM today
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
            {salad.image_url ? (
              <Image
                src={salad.image_url}
                alt={salad.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background:
                    "repeating-linear-gradient(135deg, #95B8A3 0px, #95B8A3 4px, #E8F5E9 4px, #E8F5E9 8px)",
                }}
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-semibold text-forest">
              {salad.name}
            </h3>
            {salad.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2">
                {salad.description}
              </p>
            )}
            {salad.ingredients && salad.ingredients.length > 0 && (
              <p className="text-[11px] text-muted/70 mt-1">
                {salad.ingredients.join(", ")}
              </p>
            )}
            <p className="font-display text-base font-bold text-primary mt-2">
              ₹{basePrice.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Protein add-ons */}
        {salad.protein_options && salad.protein_options.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-forest mb-2">Add Protein</p>
            <div className="flex flex-wrap gap-2">
              {salad.protein_options.map((protein) => {
                const selected = selectedProteins.some((p) => p.name === protein.name);
                return (
                  <button
                    key={protein.name}
                    type="button"
                    disabled={cutoffPassed}
                    onClick={() => toggleProtein(protein)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-forest border-black/[0.06] hover:border-primary"
                    } disabled:cursor-not-allowed`}
                  >
                    {protein.name} +₹{protein.price.toFixed(0)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to cart */}
        <div className="mt-4 flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-forest">
            Total: ₹{itemTotal.toFixed(0)}
          </p>
          <button
            onClick={() => onAdd(selectedProteins)}
            disabled={cutoffPassed}
            className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cutoffPassed ? "Closed" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
