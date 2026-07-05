"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { X, User, LogOut } from "lucide-react";
import { LeafIcon } from "@/components/leaf-icon";

export function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return;
      setUser({ id: u.id, email: u.email });
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      if (data) setProfile(data as Profile);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email } : null);
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .single();
        setProfile(data as Profile | null);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const isAdmin = profile?.role === "admin";

  return (
    <nav className="bg-forest text-cream sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <LeafIcon size={18} fill="#95B8A3" />
            <span className="font-display font-bold text-cream tracking-tight text-[16px] leading-none">
              fork yeah
            </span>
            <span className="text-sage tracking-[2px] uppercase text-[10px] font-medium leading-none">
              salads
            </span>
          </Link>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-5">
            {/* Search icon */}
            <button className="text-cream/70 hover:text-cream transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Cart icon */}
            <Link href="/cart" className="relative text-cream/70 hover:text-cream transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-terracotta text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link href="/admin" className="text-sage hover:text-cream transition-colors text-sm font-medium">
                Admin
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 text-cream/70 hover:text-cream transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm max-w-[120px] truncate">
                    {profile?.full_name || user.email}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-forest border border-sage/20 rounded-[12px] py-1 z-50">
                    <Link
                      href="/account/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-cream/80 hover:text-cream hover:bg-sage/10 text-sm transition-colors"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-cream/80 hover:text-cream hover:bg-sage/10 text-sm transition-colors"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-cream/80 hover:text-cream hover:bg-sage/10 text-sm flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-cream/70 hover:text-cream transition-colors text-sm">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-sage/20 text-cream font-medium px-4 py-1.5 rounded-full text-sm hover:bg-sage/30 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-cream/70 hover:text-cream" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-forest border-t border-sage/10">
          <div className="px-4 py-3 space-y-1">
            <Link href="/menu" onClick={() => setMobileOpen(false)} className="block py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
              Menu
            </Link>
            <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
              Cart
              {cartCount > 0 && (
                <span className="bg-terracotta text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2.5 text-sage hover:text-cream text-sm transition-colors">
                Admin
              </Link>
            )}
            <hr className="border-sage/10" />
            {user ? (
              <>
                <Link href="/account/settings" onClick={() => setMobileOpen(false)} className="block py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
                  Settings
                </Link>
                <Link href="/account/orders" onClick={() => setMobileOpen(false)} className="block py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
                  My Orders
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 py-2.5 text-cream/80 hover:text-cream text-sm w-full transition-colors">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block py-2.5 text-cream/80 hover:text-cream text-sm transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
