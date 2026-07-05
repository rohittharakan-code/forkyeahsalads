"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Loader2, Check } from "lucide-react";

export default function AccountSettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const profile = data as Profile;
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setAddress(profile.address ?? "");
      }
      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to update your profile.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, address })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-forest mb-6">
        Account Settings
      </h1>

      {success && (
        <div className="bg-mint text-primary rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Profile updated
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[14px] p-6 border border-black/[0.06]">
        <h2 className="font-display text-sm font-semibold text-forest mb-4">
          Personal Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-forest mb-1.5">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-forest mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-forest mb-1.5">
              Delivery Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your delivery address"
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-forest mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-black/[0.06] bg-cream/50 cursor-not-allowed px-4 py-3 text-sm text-forest placeholder:text-muted/60 outline-none transition"
            />
            <p className="text-xs text-muted mt-1">
              Contact us to change your email
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary rounded-xl px-6 py-3 text-white font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
