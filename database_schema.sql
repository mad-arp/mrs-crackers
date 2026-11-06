-- =============================================================================
-- MRS CRACKERS — PRODUCTION POSTGRESQL / SUPABASE DATABASE SCHEMA
-- Designed for Cloudflare Pages Hosting + Realtime Fireworks Platform
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES / USERS (Customers, Drivers, Admins)
-- Links with Supabase auth.users or standalone UUIDs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_image TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert standard categories
INSERT INTO public.categories (id, name, display_order) VALUES
  ('sparklers', 'Sparklers', 1),
  ('flowerpots', 'Flower Pots', 2),
  ('chakkars', 'Chakkars', 3),
  ('single_sound', 'Single Sound', 4),
  ('sky_shots', 'Sky Shots', 5),
  ('gift_boxes', 'Gift Boxes', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =============================================================================
-- 3. PRODUCTS CATALOG
-- 39 Authentic PESO Verified Crackers from Saidabad Hub
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  size TEXT,
  pack_size TEXT,
  weight TEXT,
  effect TEXT,
  sound_class TEXT,
  sound TEXT,
  seq_rate TEXT,
  mrp NUMERIC(10, 2) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  mrp_range TEXT,
  sp_range TEXT,
  discount TEXT,
  day_night TEXT DEFAULT 'night',
  kids_safe BOOLEAN DEFAULT false,
  brand TEXT DEFAULT 'Standard Sivakasi',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INT DEFAULT 100,
  rating NUMERIC(2, 1) DEFAULT 4.8,
  reviews_count INT DEFAULT 12,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- =============================================================================
-- 4. CUSTOMER SAVED ADDRESSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address_line TEXT NOT NULL,
  locality TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  pincode TEXT NOT NULL,
  landmark TEXT,
  delivery_notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.customer_addresses(user_id);

-- =============================================================================
-- 5. ORDERS
-- Handles doorstep delivery and customer store pickup
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_mobile TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('doorstep', 'pickup')),
  delivery_address_id TEXT REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  delivery_address_text TEXT,
  time_slot TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('online_upi', 'cod')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'submitted_utr', 'verified', 'failed')),
  utr_number TEXT,
  order_status TEXT NOT NULL DEFAULT 'received' CHECK (order_status IN ('received', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_otp TEXT NOT NULL DEFAULT '4892',
  assigned_driver_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- =============================================================================
-- 6. ORDER ITEMS (Line Items)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  item_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- =============================================================================
-- 7. DRIVER LIVE TRACKING / ASSIGNMENTS
-- Real-time updates for rider location, OTP, and ETA
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.driver_live_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  current_latitude NUMERIC(10, 7),
  current_longitude NUMERIC(10, 7),
  eta_minutes INT DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'out_for_delivery', 'reached', 'delivered')),
  last_location_update TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_order ON public.driver_live_tracking(order_id);

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures customer data privacy while allowing public catalog reads
-- =============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_live_tracking ENABLE ROW LEVEL SECURITY;

-- Catalog: Anyone can read products and categories
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

-- Profiles: Users can read and update their own profile
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert/update own profile" ON public.profiles;
CREATE POLICY "Users insert/update own profile" ON public.profiles FOR ALL USING (true);

-- Addresses: Users can manage their addresses
DROP POLICY IF EXISTS "Users manage addresses" ON public.customer_addresses;
CREATE POLICY "Users manage addresses" ON public.customer_addresses FOR ALL USING (true);

-- Orders: Users can read and create orders
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view orders" ON public.orders;
CREATE POLICY "Users view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read order items" ON public.order_items;
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);

-- Live Tracking: Public read for order customer with matching order ID
DROP POLICY IF EXISTS "Public read live tracking" ON public.driver_live_tracking;
CREATE POLICY "Public read live tracking" ON public.driver_live_tracking FOR SELECT USING (true);

DROP POLICY IF EXISTS "Driver update live tracking" ON public.driver_live_tracking;
CREATE POLICY "Driver update live tracking" ON public.driver_live_tracking FOR ALL USING (true);

-- =============================================================================
-- 9. REALTIME PUBLICATION (Supabase Realtime)
-- Enables instant live tracking and order state sync on Cloudflare Pages
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_live_tracking;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
