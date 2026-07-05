"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";

type Step = "form" | "sent" | "profile";
type AuthTab = "magic" | "password";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("form");
  const [activeTab, setActiveTab] = useState<AuthTab>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const needsProfile = searchParams.get("complete-profile") === "true";

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && needsProfile) {
        setStep("profile");
        setCheckingAuth(false);
        return;
      }

      if (user && !needsProfile) {
        router.replace("/menu");
        return;
      }

      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setStep("sent");
    setResendCooldown(30);
    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setResendCooldown(30);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        router.push("/login?complete-profile=true");
        setStep("profile");
        setLoading(false);
        return;
      }
    }

    router.push("/menu");
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Please sign in again.");
      setStep("form");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone,
      address: pinCode ? `${address}, ${pinCode}` : address,
      role: "user",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/menu");
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
        {/* Step 1: Sign in form */}
        {step === "form" && (
          <>
            <div className="flex flex-col items-center mb-6">
              <h1 className="font-display text-2xl font-bold text-forest">
                Welcome back
              </h1>
              <p className="text-muted text-sm mt-1">
                Sign in to your account
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-black/[0.06] mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab("magic"); setError(null); }}
                className={`flex-1 pb-3 text-sm font-medium transition ${activeTab === "magic" ? "text-primary border-b-2 border-primary" : "text-muted"}`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("password"); setError(null); }}
                className={`flex-1 pb-3 text-sm font-medium transition ${activeTab === "password" ? "text-primary border-b-2 border-primary" : "text-muted"}`}
              >
                Password
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            {/* Magic Link Tab */}
            {activeTab === "magic" && (
              <form onSubmit={handleSendLink} className="space-y-5">
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
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary rounded-xl py-3 font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Sign-in Link"}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSignIn} className="space-y-5">
                <div>
                  <label
                    htmlFor="email-pw"
                    className="block text-sm font-medium text-forest mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email-pw"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-forest placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    placeholder="you@example.com"
                    autoFocus
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
                    placeholder="Your password"
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
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-primary text-sm hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-muted text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary text-sm hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </>
        )}

        {/* Step 2: Check your email */}
        {step === "sent" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mx-auto mb-5">
              <Mail className="w-8 h-8 text-primary" />
            </div>

            <h1 className="font-display text-2xl font-bold text-forest mb-2">
              Check your email
            </h1>
            <p className="text-muted text-sm mb-2">
              We sent a sign-in link to
            </p>
            <p className="font-medium text-forest text-sm mb-6">{email}</p>

            <div className="bg-mint/60 rounded-xl p-4 text-sm text-primary mb-6">
              Click the link in your email to sign in. Check your spam folder if you don&apos;t see it.
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                className="text-sm text-muted hover:text-forest transition"
              >
                Change email
              </button>

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm text-primary font-medium hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed transition"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend link"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete profile (new users) */}
        {step === "profile" && (
          <>
            <div className="flex flex-col items-center mb-8">
              <h1 className="font-display text-2xl font-bold text-forest">
                Complete your profile
              </h1>
              <p className="text-muted text-sm mt-1">
                Just a few details to get started
              </p>
            </div>

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

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
                  htmlFor="phone"
                  className="block text-sm font-medium text-forest mb-1"
                >
                  Phone
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary rounded-xl py-3 font-semibold text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Get Started"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
