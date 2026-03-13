-- Drop ALL existing policies for all tables
DROP POLICY IF EXISTS "Allow public select access to customers" ON customers;
DROP POLICY IF EXISTS "Allow public insert access to customers" ON customers;
DROP POLICY IF EXISTS "Allow public update access to customers" ON customers;
DROP POLICY IF EXISTS "Allow public delete access to customers" ON customers;

DROP POLICY IF EXISTS "Allow public select access to products" ON products;
DROP POLICY IF EXISTS "Allow public insert access to products" ON products;
DROP POLICY IF EXISTS "Allow public update access to products" ON products;
DROP POLICY IF EXISTS "Allow public delete access to products" ON products;

DROP POLICY IF EXISTS "Allow public select access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public update access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete access to orders" ON orders;

DROP POLICY IF EXISTS "Allow public select access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public insert access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public update access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public delete access to order_items" ON order_items;

DROP POLICY IF EXISTS "Allow public select access to invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public insert access to invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public update access to invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public delete access to invoices" ON invoices;

DROP POLICY IF EXISTS "Allow public select access to payments" ON payments;
DROP POLICY IF EXISTS "Allow public insert access to payments" ON payments;
DROP POLICY IF EXISTS "Allow public update access to payments" ON payments;
DROP POLICY IF EXISTS "Allow public delete access to payments" ON payments;

DROP POLICY IF EXISTS "Allow public select access to inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Allow public insert access to inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Allow public update access to inventory_entries" ON inventory_entries;
DROP POLICY IF EXISTS "Allow public delete access to inventory_entries" ON inventory_entries;

DROP POLICY IF EXISTS "Allow public select access to settings" ON settings;
DROP POLICY IF EXISTS "Allow public insert access to settings" ON settings;
DROP POLICY IF EXISTS "Allow public update access to settings" ON settings;
DROP POLICY IF EXISTS "Allow public delete access to settings" ON settings;

DROP POLICY IF EXISTS "Allow public select access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public insert access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public update access to emails" ON emails;
DROP POLICY IF EXISTS "Allow public delete access to emails" ON emails;

DROP POLICY IF EXISTS "Authenticated users can view emails" ON emails;
DROP POLICY IF EXISTS "Authenticated users can insert emails" ON emails;
DROP POLICY IF EXISTS "Authenticated users can update emails" ON emails;
DROP POLICY IF EXISTS "Authenticated users can delete emails" ON emails;