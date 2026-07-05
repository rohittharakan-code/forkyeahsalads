"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store";
import type { PaymentMethod, Profile, SiteSettings } from "@/lib/types";
import { Loader2, Upload, Banknote, MapPin, CheckCircle2, XCircle } from "lucide-react";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Delivery distance check state
  const [siteSettings, setSiteSettings] = useState<Pick<SiteSettings, "shop_latitude" | "shop_longitude" | "delivery_radius_km"> | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "checking" | "available" | "too_far" | "denied">("idle");
  const [userDistance, setUserDistance] = useState<number | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);

  // Auth check & profile pre-fill
  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      // Pre-fill from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("address, phone")
        .eq("id", user.id)
        .single<Pick<Profile, "address" | "phone">>();

      if (profile) {
        if (profile.address) setAddress(profile.address);
        if (profile.phone) setPhone(profile.phone);
      }

      // Fetch site settings for delivery radius check
      const { data: settings } = await supabase
        .from("site_settings")
        .select("shop_latitude, shop_longitude, delivery_radius_km")
        .single();

      if (settings) {
        setSiteSettings(settings);
      }

      setAuthChecked(true);
    }
    check();
  }, []);

  // Redirect if cart is empty after auth is confirmed
  useEffect(() => {
    if (authChecked && items.length === 0) {
      router.replace("/cart");
    }
  }, [authChecked, items.length]);

  function handleCheckLocation() {
    if (!siteSettings) return;

    setCheckingLocation(true);
    setDeliveryStatus("checking");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const shopLat = siteSettings.shop_latitude;
        const shopLng = siteSettings.shop_longitude;

        // If shop location isn't configured, allow all orders
        if (shopLat == null || shopLng == null) {
          setDeliveryStatus("available");
          setCheckingLocation(false);
          return;
        }

        const distance = haversineKm(latitude, longitude, shopLat, shopLng);
        const rounded = Math.round(distance * 10) / 10;
        setUserDistance(rounded);

        if (distance <= siteSettings.delivery_radius_km) {
          setDeliveryStatus("available");
        } else {
          setDeliveryStatus("too_far");
        }
        setCheckingLocation(false);
      },
      () => {
        // User denied or error — don't block the order
        setDeliveryStatus("denied");
        setCheckingLocation(false);
      }
    );
  }

  // Whether submit should be disabled due to delivery distance
  const deliveryBlocked = deliveryStatus === "too_far";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!address.trim()) {
      setError("Delivery address is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (paymentMethod === "proof_upload" && !proofFile) {
      setError("Please upload your payment proof.");
      return;
    }

    setSubmitting(true);

    try {
      let paymentProofUrl: string | null = null;

      // Upload payment proof if selected
      if (paymentMethod === "proof_upload" && proofFile) {
        const ext = proofFile.name.split(".").pop() ?? "jpg";
        const filePath = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, proofFile);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);

        paymentProofUrl = publicUrl;
      }

      // Build order items
      const orderItems = items.map((i) => ({
        salad_id: i.salad.id,
        name: i.salad.name,
        price: i.salad.price,
        quantity: i.quantity,
      }));

      // Insert order
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: userId,
        items: orderItems,
        total: total(),
        status: "pending",
        payment_method: paymentMethod,
        payment_proof_url: paymentProofUrl,
        delivery_address: address.trim(),
        delivery_notes: deliveryNotes.trim() || null,
        phone: phone.trim(),
      });

      if (orderError) {
        throw new Error(`Order failed: ${orderError.message}`);
      }

      clearCart();
      router.push("/account/orders?success=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10">
      <h1 className="font-display text-2xl font-bold text-forest mb-6">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Order Summary */}
        <section>
          <h2 className="font-display text-sm font-semibold text-forest mb-3">
            Order Summary
          </h2>
          <div className="bg-mint/40 rounded-[14px] p-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.salad.id}
                className="flex items-center gap-3"
              >
                <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-cream">
                  <Image
                    src={item.salad.image_url}
                    alt={item.salad.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-medium text-forest truncate">
                    {item.salad.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-display text-sm font-semibold text-primary">
                  ₹{(item.salad.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

            {/* Total row */}
            <div className="flex justify-between items-center pt-3 border-t border-forest/10">
              <p className="font-display text-[15px] font-bold text-forest">
                Total
              </p>
              <p className="font-display text-[15px] font-bold text-primary">
                ₹{total().toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        {/* Delivery Availability Check */}
        {siteSettings && (
          <section>
            <h2 className="font-display text-sm font-semibold text-forest mb-3">
              Check Delivery Availability
            </h2>

            {deliveryStatus === "idle" && (
              <button
                type="button"
                onClick={handleCheckLocation}
                className="border border-primary text-primary rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/5 transition flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Check my location
              </button>
            )}

            {deliveryStatus === "checking" && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking your location...
              </div>
            )}

            {deliveryStatus === "available" && (
              <div className="bg-mint text-primary rounded-[14px] px-4 py-3 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Delivery available to your location!
              </div>
            )}

            {deliveryStatus === "too_far" && (
              <div className="bg-red-50 text-red-700 rounded-[14px] px-4 py-3 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                Sorry, we only deliver within {siteSettings.delivery_radius_km} km. You&apos;re {userDistance} km away.
              </div>
            )}

            {deliveryStatus === "denied" && (
              <div className="bg-mint/40 text-muted rounded-[14px] px-4 py-3 text-sm">
                Please enable location access or contact us to verify delivery availability.
              </div>
            )}
          </section>
        )}

        {/* Delivery Details */}
        <section>
          <h2 className="font-display text-sm font-semibold text-forest mb-3">
            Delivery Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-forest mb-1.5"
              >
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your delivery address"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-forest mb-1.5"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="e.g. +971 50 123 4567"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-forest mb-1.5"
              >
                Delivery Notes{" "}
                <span className="text-muted text-xs">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm text-forest placeholder:text-muted/60 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                placeholder="Gate code, landmark, special instructions..."
              />
            </div>
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h2 className="font-display text-sm font-semibold text-forest mb-3">
            Payment Method
          </h2>
          <div className="space-y-3">
            {/* Upload Payment Proof */}
            <label
              className={`flex items-start gap-3 rounded-[14px] p-4 cursor-pointer transition border ${
                paymentMethod === "proof_upload"
                  ? "border-primary bg-primary/5"
                  : "border-black/[0.06] hover:border-sage"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="proof_upload"
                checked={paymentMethod === "proof_upload"}
                onChange={() => setPaymentMethod("proof_upload")}
                className="mt-1 accent-[#2D6A4F]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-primary" />
                  <span className="font-display text-sm font-medium text-forest">
                    Upload Payment Proof
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Upload a screenshot or photo of your bank transfer / payment
                </p>

                {paymentMethod === "proof_upload" && (
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProofFile(e.target.files?.[0] ?? null)
                      }
                      className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition"
                    />
                    {proofFile && (
                      <p className="text-[11px] text-primary mt-2">
                        Selected: {proofFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Cash on Delivery */}
            <label
              className={`flex items-start gap-3 rounded-[14px] p-4 cursor-pointer transition border ${
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5"
                  : "border-black/[0.06] hover:border-sage"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => {
                  setPaymentMethod("cod");
                  setProofFile(null);
                }}
                className="mt-1 accent-[#2D6A4F]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4.5 h-4.5 text-primary" />
                  <span className="font-display text-sm font-medium text-forest">
                    Cash on Delivery
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Pay with cash when your order arrives
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-[14px] text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || deliveryBlocked}
          className="w-full bg-primary rounded-[14px] py-4 text-[15px] font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order — ₹${total().toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  );
}
