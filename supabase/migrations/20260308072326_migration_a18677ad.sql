-- Create ONE simple policy for all operations
CREATE POLICY "Allow all operations for authenticated users"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);