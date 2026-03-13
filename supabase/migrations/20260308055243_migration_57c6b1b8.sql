-- Create emails table to track all sent emails
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN ('order_confirmation', 'invoice')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all emails
CREATE POLICY "Authenticated users can view emails" ON emails
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert emails
CREATE POLICY "Authenticated users can insert emails" ON emails
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better query performance
CREATE INDEX emails_customer_id_idx ON emails(customer_id);
CREATE INDEX emails_order_id_idx ON emails(order_id);
CREATE INDEX emails_sent_at_idx ON emails(sent_at DESC);
CREATE INDEX emails_email_type_idx ON emails(email_type);
CREATE INDEX emails_status_idx ON emails(status);