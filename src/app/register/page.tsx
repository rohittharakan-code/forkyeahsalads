"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/menu");
        return;
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If user is confirmed immediately (auto-confirm enabled), create profile and redirect
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        phone,
        address: pinCode ? `${address}, ${pinCode}` : address,
        role: "user",
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/menu");
      return;
    }

    // Email confirmation required
    setSuccess("Check your email to confirm your account. You can then sign in.");
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-black/[0.06] mx-auto mt-16">
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-display text-2xl font-bold text-forest">
            Create Account
          </h1>
          <p className="text-muted text-sm mt-1">
            Join fork yeah salads
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-mint text-primary text-sm rounded-xl p-3 mb-4">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-forest mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Your full name"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-forest mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-forest mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-forest mb-1"
              >
                Delivery Address
              </label>
              <input
                id="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Your delivery address"
              />
            </div>

            <div>
              <label
                htmlFor="pinCode"
                className="block text-sm font-medium text-forest mb-1"
              >
                PIN Code
              </label>
              <input
                id="pinCode"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="e.g. 500032"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-forest mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-forest mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary rounded-xl py-3 font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-muted text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary text-sm hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
