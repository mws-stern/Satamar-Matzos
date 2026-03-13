-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Create new policies that allow public access
CREATE POLICY "Allow public read access to customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to customers" ON customers FOR DELETE USING (true);