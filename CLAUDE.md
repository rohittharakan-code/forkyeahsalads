# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fork Yeah Salads (`forkyeahsalads.com`) — a salad ordering web app with admin panel and customer storefront. Built with Next.js 16 (App Router) + Supabase + Tailwind CSS v4.

## Commands

```bash
# Dev server (path contains &, so use node directly)
node node_modules/next/dist/bin/next dev

# Build
node node_modules/next/dist/bin/next build

# Lint
npx eslint .
```

**Note:** `npx next` and `npm run dev` break because the directory path contains `&`. Always invoke Next.js via `node node_modules/next/dist/bin/next`.

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 App Router, React 19, Tailwind CSS v4 (theme in `globals.css` via `@theme inline`)
- **Backend/Auth/Storage:** Supabase (auth, Postgres, Storage buckets)
- **State:** Zustand for client-side cart (persisted to localStorage)
- **Fonts:** Space Grotesk (display/headings) + DM Sans (body)
- **Icons:** lucide-react + custom SVG leaf icon

### Supabase Setup
- Three tables: `profiles`, `salad_items`, `orders` (schema in `supabase-schema.sql`)
- Two storage buckets: `salad-images` (public), `payment-proofs` (private)
- Row-Level Security on all tables — admin role checks query the `profiles` table
- Auth uses email+password with email confirmation

### Key Directories
- `src/lib/supabase/` — three Supabase client factories: `client.ts` (browser), `server.ts` (server components/route handlers), `middleware.ts` (session refresh + route protection)
- `src/lib/store.ts` — Zustand cart store with `persist` middleware
- `src/lib/types.ts` — shared TypeScript types (Profile, SaladItem, Order, etc.)
- `src/components/` — shared components (navbar, salad-card, order-status-badge, leaf-icon)

### Route Protection
Middleware (`src/middleware.ts`) handles auth redirects:
- `/admin/*` requires `role = 'admin'` in `profiles` table
- `/account/*` requires authentication
- Auth pages (`/login`, `/register`) redirect to `/` if already logged in

### Payment Flow
No payment gateway — two methods: upload payment proof (image uploaded to `payment-proofs` bucket) or Cash on Delivery. Admin reviews proofs in the Orders tab.

### Currency
All prices display with the `₹` symbol (Indian Rupee / INR). Keep this consistent when adding new price displays.

## Brand & Design System

### Colors (Tailwind classes)
| Token | Hex | Class | Usage |
|-------|-----|-------|-------|
| Deep Forest | `#1A2E22` | `bg-forest`, `text-forest` | Nav bars, dark bg, primary text |
| Primary Green | `#2D6A4F` | `bg-primary`, `text-primary` | Actions, links, selected states |
| Sage | `#95B8A3` | `bg-sage`, `text-sage` | Secondary text on dark, leaf icon |
| Terracotta | `#C17B4A` | `bg-terracotta`, `text-terracotta` | Secondary CTA, cart badge |
| Golden | `#D4A843` | `bg-golden` | Tertiary accent (sparingly) |
| Cream | `#FAF6F0` | `bg-cream`, `text-cream` | Page background |
| Mint | `#E8F5E9` | `bg-mint` | Info banners, category chips |
| Muted | `#6B7C72` | `text-muted` | Secondary body text |

### Typography
- `font-display` = Space Grotesk — headings, card titles, prices
- `font-body` = DM Sans (default) — body text, descriptions, labels
- Cards: `border border-black/6`, no box-shadows (flat design)
- Border radii: sm=8px (`rounded-lg`), md=12px (`rounded-xl`), lg=14px (`rounded-[14px]`), pill=24px (`rounded-full`)

### Logo
Brand name: "fork yeah salads" (lowercase). Leaf teardrop SVG icon in `src/components/leaf-icon.tsx`.

## Environment Variables
Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
