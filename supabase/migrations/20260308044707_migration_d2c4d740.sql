-- Products
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable full access for all users" ON products FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
CREATE POLICY "Enable full access for all users" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
CREATE POLICY "Enable full access for all users" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
CREATE POLICY "Enable full access for all users" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Invoices
DROP POLICY IF EXISTS "Enable read access for all users" ON invoices;
CREATE POLICY "Enable full access for all users" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Enable read access for all users" ON payments;
CREATE POLICY "Enable full access for all users" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Inventory Entries
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_entries;
CREATE POLICY "Enable full access for all users" ON inventory_entries FOR ALL USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Enable read access for all users" ON settings;
CREATE POLICY "Enable full access for all users" ON settings FOR ALL USING (true) WITH CHECK (true);