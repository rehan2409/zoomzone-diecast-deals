-- Add policies for products table (admin management)
CREATE POLICY "Allow all insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on products" ON public.products FOR DELETE USING (true);

-- Add policies for coupons table (admin management)
CREATE POLICY "Allow all insert on coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on coupons" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on coupons" ON public.coupons FOR DELETE USING (true);

-- Add policies for settings table (admin management)
CREATE POLICY "Allow all upsert on settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on settings" ON public.settings FOR UPDATE USING (true);

-- Add policy for orders table (admin status updates)
CREATE POLICY "Allow all update on orders" ON public.orders FOR UPDATE USING (true);