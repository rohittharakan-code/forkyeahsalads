"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-black/[0.06] mx-auto mt-16">
        {!sent ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <h1 className="font-display text-2xl font-bold text-forest">
                Reset your password
              </h1>
              <p className="text-muted text-sm mt-1">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center mx-auto mb-5">
              <Mail className="w-8 h-8 text-primary" />
            </div>

            <h1 className="font-display text-2xl font-bold text-forest mb-2">
              Check your email
            </h1>
            <p className="text-muted text-sm mb-2">
              We sent a password reset link to
            </p>
            <p className="font-medium text-forest text-sm mb-6">{email}</p>

            <div className="bg-mint text-primary text-sm rounded-xl p-3 mb-6">
              Click the link in your email to reset your password. Check your spam folder if you don&apos;t see it.
            </div>

            <Link href="/login" className="text-primary text-sm hover:underline">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
