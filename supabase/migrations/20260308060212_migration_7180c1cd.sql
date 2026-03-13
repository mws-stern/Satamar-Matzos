-- Update all other tables to allow public access as well

-- Products table
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to products" ON products FOR DELETE USING (true);

-- Orders table
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Users can delete orders" ON orders;

CREATE POLICY "Allow public read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to orders" ON orders FOR DELETE USING (true);

-- Order items table
DROP POLICY IF EXISTS "Users can view order_items" ON order_items;
DROP POLICY IF EXISTS "Users can insert order_items" ON order_items;
DROP POLICY IF EXISTS "Users can update order_items" ON order_items;
DROP POLICY IF EXISTS "Users can delete order_items" ON order_items;

CREATE POLICY "Allow public read access to order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to order_items" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to order_items" ON order_items FOR DELETE USING (true);

-- Invoices table
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

CREATE POLICY "Allow public read access to invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to invoices" ON invoices FOR DELETE USING (true);

-- Payments table
DROP POLICY IF EXISTS "Users can view payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can delete payments" ON payments;

CREATE POLICY "Allow public read access to payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to payments" ON payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to payments" ON payments FOR DELETE USING (true);

-- Inventory entries table
DROP POLICY IF EXISTS "Users can view inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Users can insert inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Users can update inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Users can delete inventory_entries" ON inventory_entries;

CREATE POLICY "Allow public read access to inventory_entries" ON inventory_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to inventory_entries" ON inventory_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to inventory_entries" ON inventory_entries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to inventory_entries" ON inventory_entries FOR DELETE USING (true);

-- Settings table
DROP POLICY IF EXISTS "Users can view settings" ON settings;
DROP POLICY IF EXISTS "Users can insert settings" ON settings;
DROP POLICY IF EXISTS "Users can update settings" ON settings;
DROP POLICY IF EXISTS "Users can delete settings" ON settings;

CREATE POLICY "Allow public read access to settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to settings" ON settings FOR DELETE USING (true);

-- Emails table
DROP POLICY IF EXISTS "Users can view emails" ON emails;
DROP POLICY IF EXISTS "Users can insert emails" ON emails;
DROP POLICY IF EXISTS "Users can update emails" ON emails;
DROP POLICY IF EXISTS "Users can delete emails" ON emails;

CREATE POLICY "Allow public read access to emails" ON emails FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to emails" ON emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to emails" ON emails FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to emails" ON emails FOR DELETE USING (true);