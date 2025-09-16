-- VMM Onboarding Platform Database Schema - FIXED VERSION
-- Run this in your Supabase SQL Editor

-- First, we need to create auth users before creating public.users records
-- This is because public.users has a foreign key reference to auth.users(id)

-- Create auth users first (these will be dummy users for testing)
-- Note: In production, these would be created through your app's authentication flow
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'client@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Client User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_platform_connections table
CREATE TABLE IF NOT EXISTS public.admin_platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, platform)
);

-- Create onboarding_links table
CREATE TABLE IF NOT EXISTS public.onboarding_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  requested_permissions JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create onboarding_requests table
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.onboarding_links(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  client_email TEXT,
  client_name TEXT,
  company_name TEXT,
  granted_permissions JSONB NOT NULL DEFAULT '{}',
  platform_connections JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table (for admin to manage)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_onboarding_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_admin_id ON public.admin_platform_connections(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_platform ON public.admin_platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON public.onboarding_links(admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON public.onboarding_links(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_status ON public.onboarding_links(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON public.onboarding_requests(link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON public.onboarding_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON public.clients(admin_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for admin_platform_connections table
DROP POLICY IF EXISTS "Admins can manage their own platform connections" ON public.admin_platform_connections;
CREATE POLICY "Admins can manage their own platform connections" ON public.admin_platform_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = admin_id 
      AND id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for onboarding_links table
DROP POLICY IF EXISTS "Admins can manage their own links" ON public.onboarding_links;
CREATE POLICY "Admins can manage their own links" ON public.onboarding_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = admin_id 
      AND id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for onboarding_requests table
DROP POLICY IF EXISTS "Admins can view requests for their links" ON public.onboarding_requests;
CREATE POLICY "Admins can view requests for their links" ON public.onboarding_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.onboarding_links 
      JOIN public.users ON onboarding_links.admin_id = users.id
      WHERE onboarding_links.id = link_id 
      AND users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Clients can manage their own requests" ON public.onboarding_requests;
CREATE POLICY "Clients can manage their own requests" ON public.onboarding_requests
  FOR ALL USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = client_id 
      AND id = auth.uid() 
      AND role = 'client'
    )
  );

-- RLS Policies for clients table
DROP POLICY IF EXISTS "Admins can manage their own clients" ON public.clients;
CREATE POLICY "Admins can manage their own clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = admin_id 
      AND id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_users ON public.users;
CREATE TRIGGER handle_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_admin_platform_connections ON public.admin_platform_connections;
CREATE TRIGGER handle_updated_at_admin_platform_connections
  BEFORE UPDATE ON public.admin_platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_onboarding_links ON public.onboarding_links;
CREATE TRIGGER handle_updated_at_onboarding_links
  BEFORE UPDATE ON public.onboarding_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_onboarding_requests ON public.onboarding_requests;
CREATE TRIGGER handle_updated_at_onboarding_requests
  BEFORE UPDATE ON public.onboarding_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_clients ON public.clients;
CREATE TRIGGER handle_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'client', -- default role
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for testing (now that auth.users exist)
INSERT INTO public.users (id, email, role, full_name, company_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'admin', 'Admin User', 'VMM Agency'),
  ('00000000-0000-0000-0000-000000000002', 'client@example.com', 'client', 'Client User', 'Client Company')
ON CONFLICT (id) DO NOTHING;

-- Insert sample onboarding link
INSERT INTO public.onboarding_links (admin_id, token, platforms, requested_permissions, expires_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo-token-12345', 
   ARRAY['meta', 'google', 'tiktok', 'shopify'],
   '{"meta": ["pages_read_engagement", "pages_manage_posts"], "google": ["analytics.readonly"], "tiktok": ["user.info.basic"], "shopify": ["read_orders"]}',
   NOW() + INTERVAL '30 days')
ON CONFLICT (token) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.admin_platform_connections TO authenticated;
GRANT ALL ON public.onboarding_links TO authenticated;
GRANT ALL ON public.onboarding_requests TO authenticated;
GRANT ALL ON public.clients TO authenticated;
