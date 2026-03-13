-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_hebrew TEXT,
  price_per_lb NUMERIC DEFAULT 0,
  category TEXT,
  description TEXT,
  in_stock BOOLEAN DEFAULT true,
  current_inventory NUMERIC DEFAULT 0,
  min_order NUMERIC
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_hebrew TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT, 
  customer_email TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  discount NUMERIC,
  discount_type TEXT,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  amount_paid NUMERIC DEFAULT 0,
  amount_due NUMERIC DEFAULT 0,
  notes TEXT,
  delivery_date TEXT,
  order_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  inventory_deducted BOOLEAN DEFAULT false
);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  product_name_hebrew TEXT,
  quantity NUMERIC DEFAULT 0,
  price_per_lb NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  discount NUMERIC,
  discount_type TEXT,
  final_price NUMERIC
);

-- 5. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_email TEXT,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  paid BOOLEAN DEFAULT false,
  payment_status TEXT,
  amount_paid NUMERIC,
  amount_due NUMERIC,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ
);

-- 6. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  credit_card_last4 TEXT,
  credit_card_details JSONB,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inventory Log
CREATE TABLE IF NOT EXISTS inventory_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  amount NUMERIC,
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT,
  company_name_hebrew TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_rate NUMERIC,
  currency TEXT
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all operations for authenticated users)
DO $$ 
BEGIN
    -- Products
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON products FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    -- Customers
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON customers FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    
    -- Orders
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON orders FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Order Items
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON order_items FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Invoices
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON invoices FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Payments
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON payments FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Inventory
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'inventory_entries' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON inventory_entries FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Settings
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Enable all for auth') THEN
        CREATE POLICY "Enable all for auth" ON settings FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;