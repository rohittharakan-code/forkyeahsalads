"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function Footer() {
  const [fssaiLicense, setFssaiLicense] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("site_settings")
      .select("fssai_license")
      .single()
      .then(({ data }) => {
        if (data?.fssai_license) {
          setFssaiLicense(data.fssai_license);
        }
      });
  }, []);

  return (
    <footer className="bg-forest text-cream/70 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-display font-medium text-cream/90">
          fork yeah salads
        </p>
        <p className="text-xs text-cream/60 mt-1">
          Fresh salads, bold flavours, zero regrets.
        </p>
        {fssaiLicense && (
          <p className="text-xs font-mono tracking-wide text-sage/70 mt-3">
            FSSAI Lic. No. {fssaiLicense}
          </p>
        )}
        <p className="text-xs text-cream/50 mt-2">
          &copy; 2025 Fork Yeah Salads
        </p>
      </div>
    </footer>
  );
}
