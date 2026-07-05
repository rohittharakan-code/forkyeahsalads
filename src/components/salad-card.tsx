"use client";

import Image from "next/image";
import { SaladItem } from "@/lib/types";

interface SaladCardProps {
  salad: SaladItem;
  onAddToCart?: () => void;
}

export function SaladCard({ salad, onAddToCart }: SaladCardProps) {
  return (
    <div className="bg-white rounded-[14px] p-3.5 border border-black/6 flex items-start gap-3">
      {/* Thumbnail */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden">
        {salad.image_url ? (
          <Image
            src={salad.image_url}
            alt={salad.name}
            fill
            className="object-cover"
            sizes="72px"
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

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
        <div>
          <h3 className="font-display text-sm font-semibold text-forest truncate">
            {salad.name}
          </h3>
          {salad.description && (
            <p className="text-[11px] text-muted line-clamp-2 mt-0.5 leading-snug">
              {salad.description}
            </p>
          )}
          {salad.ingredients && salad.ingredients.length > 0 && (
            <p className="text-[11px] text-muted/70 mt-0.5 line-clamp-1">
              {salad.ingredients.join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="font-display text-sm font-semibold text-primary">
            ₹{salad.price.toFixed(2)}
          </span>
          <button
            onClick={onAddToCart}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-primary hover:bg-forest transition-colors"
            aria-label="Add to cart"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 2.5V11.5M2.5 7H11.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
