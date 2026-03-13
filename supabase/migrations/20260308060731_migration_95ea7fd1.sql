-- Create authenticated-only policies for all tables

-- Customers
CREATE POLICY "Authenticated users can view customers" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert customers" ON customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update customers" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete customers" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete products" ON products FOR DELETE USING (auth.uid() IS NOT NULL);

-- Orders
CREATE POLICY "Authenticated users can view orders" ON orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert orders" ON orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update orders" ON orders FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete orders" ON orders FOR DELETE USING (auth.uid() IS NOT NULL);

-- Order Items
CREATE POLICY "Authenticated users can view order_items" ON order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert order_items" ON order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update order_items" ON order_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete order_items" ON order_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Invoices
CREATE POLICY "Authenticated users can view invoices" ON invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update invoices" ON invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete invoices" ON invoices FOR DELETE USING (auth.uid() IS NOT NULL);

-- Payments
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert payments" ON payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update payments" ON payments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete payments" ON payments FOR DELETE USING (auth.uid() IS NOT NULL);

-- Inventory Entries
CREATE POLICY "Authenticated users can view inventory_entries" ON inventory_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert inventory_entries" ON inventory_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update inventory_entries" ON inventory_entries FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete inventory_entries" ON inventory_entries FOR DELETE USING (auth.uid() IS NOT NULL);

-- Settings
CREATE POLICY "Authenticated users can view settings" ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert settings" ON settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update settings" ON settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete settings" ON settings FOR DELETE USING (auth.uid() IS NOT NULL);

-- Emails
CREATE POLICY "Authenticated users can view emails" ON emails FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert emails" ON emails FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update emails" ON emails FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete emails" ON emails FOR DELETE USING (auth.uid() IS NOT NULL);