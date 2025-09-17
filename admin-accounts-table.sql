-- Create admin_accounts table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'meta', 'tiktok', 'shopify')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text[], -- Array of granted scopes
  provider_user_id text, -- The user ID from the provider (e.g., Google user ID)
  provider_email text, -- Email from the provider
  provider_name text, -- Display name from the provider
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(admin_id, provider) -- One account per provider per admin
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_accounts_admin_id ON admin_accounts(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_provider ON admin_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_expires_at ON admin_accounts(expires_at);

-- Add RLS policies
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can only see their own accounts
CREATE POLICY "Admins can view own accounts" ON admin_accounts
  FOR SELECT USING (
    admin_id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Policy: Admins can insert their own accounts
CREATE POLICY "Admins can insert own accounts" ON admin_accounts
  FOR INSERT WITH CHECK (
    admin_id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Policy: Admins can update their own accounts
CREATE POLICY "Admins can update own accounts" ON admin_accounts
  FOR UPDATE USING (
    admin_id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Policy: Admins can delete their own accounts
CREATE POLICY "Admins can delete own accounts" ON admin_accounts
  FOR DELETE USING (
    admin_id IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );
