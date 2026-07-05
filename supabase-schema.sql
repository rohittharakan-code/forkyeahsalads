-- Run this in your Supabase SQL Editor to set up the database

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text not null default '',
  address text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper function to check admin status without RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Site settings (FSSAI, delivery zone, etc.)
create table public.site_settings (
  id uuid default gen_random_uuid() primary key,
  fssai_license text,
  shop_latitude double precision,
  shop_longitude double precision,
  delivery_radius_km numeric(6,1) not null default 10,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Anyone can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

alter table public.site_settings add column if not exists upi_address text;
alter table public.site_settings add column if not exists qr_code_url text;
alter table public.site_settings add column if not exists whatsapp_number text;

-- Seed a single settings row
insert into public.site_settings (fssai_license, shop_latitude, shop_longitude, delivery_radius_km)
values (null, null, null, 10);

-- Salad items table
create table public.salad_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  image_url text not null default '',
  category text not null default 'Salads',
  ingredients text[] not null default '{}',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.salad_items enable row level security;

create policy "Anyone can view available salads"
  on public.salad_items for select
  using (true);

create policy "Admins can insert salads"
  on public.salad_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update salads"
  on public.salad_items for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete salads"
  on public.salad_items for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('proof_upload', 'cod')),
  payment_proof_url text,
  delivery_address text not null,
  delivery_notes text,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage buckets (run these separately or via the Supabase dashboard)
-- 1. Create bucket 'salad-images' (public)
-- 2. Create bucket 'payment-proofs' (private — only authenticated users)

-- To make yourself an admin, after registering run:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
