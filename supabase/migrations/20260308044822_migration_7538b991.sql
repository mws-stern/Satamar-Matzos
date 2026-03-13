-- Products
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for auth" ON products;
DROP POLICY IF EXISTS "Enable update for auth" ON products;
DROP POLICY IF EXISTS "Enable full access for all users" ON products;
CREATE POLICY "Enable full access for all users" ON products FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for auth" ON customers;
DROP POLICY IF EXISTS "Enable update for auth" ON customers;
DROP POLICY IF EXISTS "Enable full access for all users" ON customers;
CREATE POLICY "Enable full access for all users" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for auth" ON orders;
DROP POLICY IF EXISTS "Enable update for auth" ON orders;
DROP POLICY IF EXISTS "Enable full access for all users" ON orders;
CREATE POLICY "Enable full access for all users" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert for auth" ON order_items;
DROP POLICY IF EXISTS "Enable update for auth" ON order_items;
DROP POLICY IF EXISTS "Enable full access for all users" ON order_items;
CREATE POLICY "Enable full access for all users" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Invoices
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for auth" ON invoices;
DROP POLICY IF EXISTS "Enable update for auth" ON invoices;
DROP POLICY IF EXISTS "Enable full access for all users" ON invoices;
CREATE POLICY "Enable full access for all users" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
DROP POLICY IF EXISTS "Enable insert for auth" ON payments;
DROP POLICY IF EXISTS "Enable update for auth" ON payments;
DROP POLICY IF EXISTS "Enable full access for all users" ON payments;
CREATE POLICY "Enable full access for all users" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Inventory
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_entries;
DROP POLICY IF EXISTS "Enable insert for auth" ON inventory_entries;
DROP POLICY IF EXISTS "Enable update for auth" ON inventory_entries;
DROP POLICY IF EXISTS "Enable full access for all users" ON inventory_entries;
CREATE POLICY "Enable full access for all users" ON inventory_entries FOR ALL USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
DROP POLICY IF EXISTS "Enable insert for auth" ON settings;
DROP POLICY IF EXISTS "Enable update for auth" ON settings;
DROP POLICY IF EXISTS "Enable full access for all users" ON settings;
CREATE POLICY "Enable full access for all users" ON settings FOR ALL USING (true) WITH CHECK (true);