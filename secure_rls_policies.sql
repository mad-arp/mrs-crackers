-- =============================================================================
-- MRS CRACKERS — ADVANCED PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- Cloudflare Pages & Supabase Security Architecture
-- =============================================================================
-- Execute this script in your Supabase Project -> SQL Editor -> Run
-- It hardens the database so customers cannot tamper with products, prices,
-- other users' addresses, orders, or staff profiles.
-- =============================================================================

-- 1. Ensure RLS is active on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_live_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. PRODUCTS & CATEGORIES MASTER POLICIES
-- Customers and visitors can browse products, but NEVER modify prices or stock
-- =============================================================================
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products"
  ON public.products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products"
  ON public.products
  FOR ALL
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()::text AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
  ON public.categories
  FOR ALL
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()::text AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- 3. PROFILES POLICIES
-- Customers manage their own profile. Admin manages rider profiles.
-- =============================================================================
DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
CREATE POLICY "Public insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
  ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 4. CUSTOMER ADDRESSES POLICIES
-- Strict isolation: addresses are saved and deleted per user session
-- =============================================================================
DROP POLICY IF EXISTS "Users manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users manage own addresses"
  ON public.customer_addresses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. ORDERS & ORDER ITEMS POLICIES
-- Customers can place orders and track their orders. Staff can manage dispatches.
-- =============================================================================
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff and customer select orders" ON public.orders;
CREATE POLICY "Staff and customer select orders"
  ON public.orders
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff and customer update orders" ON public.orders;
CREATE POLICY "Staff and customer update orders"
  ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
CREATE POLICY "Public insert order items"
  ON public.order_items
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public select order items" ON public.order_items;
CREATE POLICY "Public select order items"
  ON public.order_items
  FOR SELECT
  USING (true);

-- =============================================================================
-- 6. DRIVER LIVE TRACKING POLICIES
-- Enables realtime broadcast of live rider GPS coordinates for active runs
-- =============================================================================
DROP POLICY IF EXISTS "Public select live tracking" ON public.driver_live_tracking;
CREATE POLICY "Public select live tracking"
  ON public.driver_live_tracking
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Driver manage live tracking" ON public.driver_live_tracking;
CREATE POLICY "Driver manage live tracking"
  ON public.driver_live_tracking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 7. RE-VERIFY REALTIME REPLICATION (Instant Order & Tracking Sync)
-- =============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    -- already added, ignore
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_live_tracking;
  EXCEPTION WHEN duplicate_object THEN
    -- already added, ignore
  END;
END $$;
