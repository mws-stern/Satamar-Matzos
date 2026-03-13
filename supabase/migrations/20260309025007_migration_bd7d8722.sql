-- Create a policy to allow anyone to read customer data
CREATE POLICY "Anyone can view customers" ON customers FOR SELECT USING (true);