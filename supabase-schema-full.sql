-- =============================================================================
-- VMM Onboarding — FULL Supabase schema (fresh project)
-- =============================================================================
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
-- Then set .env.local + Netlify:
--   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
--   (legacy: NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — still supported in app code)
--
-- Notes:
-- - Uses service role on the server for most writes; RLS still protects direct client access.
-- - After run: configure Auth → URL configuration (Site URL + Redirect URLs) for your Netlify domain.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USERS (profiles; extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name text,
  company_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. ADMIN PLATFORM CONNECTIONS (Meta / Google / TikTok / Shopify tokens)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, platform)
);

-- -----------------------------------------------------------------------------
-- 3. ADMIN ACCOUNTS (parallel OAuth store used by src/lib/oauth/oauth-utils.ts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('meta', 'google', 'tiktok', 'shopify')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text[] NOT NULL DEFAULT '{}',
  provider_user_id text,
  provider_email text,
  provider_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, provider)
);

-- -----------------------------------------------------------------------------
-- 4. CLIENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company_name text,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  last_onboarding_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. ONBOARDING LINKS (RESTRICT: deleting auth user does not auto-delete links)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  link_name text,
  token text NOT NULL UNIQUE,
  platforms text[] NOT NULL DEFAULT '{}',
  requested_permissions jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')) DEFAULT 'pending',
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. ONBOARDING REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.onboarding_links (id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  client_email text,
  client_name text,
  company_name text,
  granted_permissions jsonb NOT NULL DEFAULT '{}',
  platform_connections jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. CLIENT PLATFORM CONNECTIONS (client_id is text: UUID or onboarding token)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok', 'shopify')),
  platform_user_id text NOT NULL,
  platform_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform)
);

-- -----------------------------------------------------------------------------
-- 8. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_admin_id ON public.admin_platform_connections (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_platform ON public.admin_platform_connections (platform);
CREATE INDEX IF NOT EXISTS idx_admin_platform_connections_active ON public.admin_platform_connections (is_active);

CREATE INDEX IF NOT EXISTS idx_admin_accounts_admin_id ON public.admin_accounts (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_provider ON public.admin_accounts (provider);

CREATE INDEX IF NOT EXISTS idx_clients_admin_id ON public.clients (admin_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients (status);

CREATE INDEX IF NOT EXISTS idx_onboarding_links_admin_id ON public.onboarding_links (admin_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_token ON public.onboarding_links (token);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_status ON public.onboarding_links (status);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_expires_at ON public.onboarding_links (expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_link_name ON public.onboarding_links (link_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_links_is_used ON public.onboarding_links (is_used);

CREATE INDEX IF NOT EXISTS idx_onboarding_requests_link_id ON public.onboarding_requests (link_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_client_id ON public.onboarding_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON public.onboarding_requests (status);

CREATE INDEX IF NOT EXISTS idx_client_platform_connections_client_id ON public.client_platform_connections (client_id);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_platform ON public.client_platform_connections (platform);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_active ON public.client_platform_connections (is_active);
CREATE INDEX IF NOT EXISTS idx_client_platform_connections_assets ON public.client_platform_connections USING gin (assets);

-- -----------------------------------------------------------------------------
-- 9. updated_at trigger helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_platform_connections_updated_at ON public.admin_platform_connections;
CREATE TRIGGER update_admin_platform_connections_updated_at
  BEFORE UPDATE ON public.admin_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_accounts_updated_at ON public.admin_accounts;
CREATE TRIGGER update_admin_accounts_updated_at
  BEFORE UPDATE ON public.admin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_links_updated_at ON public.onboarding_links;
CREATE TRIGGER update_onboarding_links_updated_at
  BEFORE UPDATE ON public.onboarding_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_requests_updated_at ON public.onboarding_requests;
CREATE TRIGGER update_onboarding_requests_updated_at
  BEFORE UPDATE ON public.onboarding_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_platform_connections_updated_at ON public.client_platform_connections;
CREATE TRIGGER update_client_platform_connections_updated_at
  BEFORE UPDATE ON public.client_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 10. Auto-create public.users row when auth.users row is inserted
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  IF v_role NOT IN ('admin', 'client') THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, role, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_role,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      ''
    ),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 11. Utility functions (optional; safe to keep)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_token_valid(token_uuid text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.onboarding_links ol
    WHERE ol.token = token_uuid
      AND ol.status = 'pending'
      AND ol.expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_platform_connections(admin_uuid uuid)
RETURNS TABLE (
  platform text,
  platform_user_id text,
  platform_username text,
  scopes text[],
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    apc.platform,
    apc.platform_user_id,
    apc.platform_username,
    apc.scopes,
    apc.is_active,
    apc.created_at
  FROM public.admin_platform_connections apc
  WHERE apc.admin_id = admin_uuid
    AND apc.is_active = true
  ORDER BY apc.created_at DESC;
$$;

-- -----------------------------------------------------------------------------
-- 12. Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_platform_connections ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- admin_platform_connections
DROP POLICY IF EXISTS "Admins can view their own platform connections" ON public.admin_platform_connections;
CREATE POLICY "Admins can view their own platform connections" ON public.admin_platform_connections
  FOR SELECT USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can insert their own platform connections" ON public.admin_platform_connections;
CREATE POLICY "Admins can insert their own platform connections" ON public.admin_platform_connections
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can update their own platform connections" ON public.admin_platform_connections;
CREATE POLICY "Admins can update their own platform connections" ON public.admin_platform_connections
  FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can delete their own platform connections" ON public.admin_platform_connections;
CREATE POLICY "Admins can delete their own platform connections" ON public.admin_platform_connections
  FOR DELETE USING (auth.uid() = admin_id);

-- admin_accounts (server uses service role; policies for consistency if RLS ever hits anon key)
DROP POLICY IF EXISTS "Admins can manage their admin_accounts" ON public.admin_accounts;
CREATE POLICY "Admins can manage their admin_accounts" ON public.admin_accounts
  FOR ALL USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

-- clients
DROP POLICY IF EXISTS "Admins can view their own clients" ON public.clients;
CREATE POLICY "Admins can view their own clients" ON public.clients
  FOR SELECT USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can insert their own clients" ON public.clients;
CREATE POLICY "Admins can insert their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can update their own clients" ON public.clients;
CREATE POLICY "Admins can update their own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can delete their own clients" ON public.clients;
CREATE POLICY "Admins can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = admin_id);

-- onboarding_links
DROP POLICY IF EXISTS "Admins can view their own onboarding links" ON public.onboarding_links;
CREATE POLICY "Admins can view their own onboarding links" ON public.onboarding_links
  FOR SELECT USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can insert their own onboarding links" ON public.onboarding_links;
CREATE POLICY "Admins can insert their own onboarding links" ON public.onboarding_links
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can update their own onboarding links" ON public.onboarding_links;
CREATE POLICY "Admins can update their own onboarding links" ON public.onboarding_links
  FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Admins can delete their own onboarding links" ON public.onboarding_links;
CREATE POLICY "Admins can delete their own onboarding links" ON public.onboarding_links
  FOR DELETE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Public can view onboarding links by token" ON public.onboarding_links;
CREATE POLICY "Public can view onboarding links by token" ON public.onboarding_links
  FOR SELECT USING (true);

-- onboarding_requests
DROP POLICY IF EXISTS "Admins can view requests for their links" ON public.onboarding_requests;
CREATE POLICY "Admins can view requests for their links" ON public.onboarding_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.onboarding_links ol
      WHERE ol.id = onboarding_requests.link_id
        AND ol.admin_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can insert onboarding requests" ON public.onboarding_requests;
CREATE POLICY "Public can insert onboarding requests" ON public.onboarding_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update requests for their links" ON public.onboarding_requests;
CREATE POLICY "Admins can update requests for their links" ON public.onboarding_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.onboarding_links ol
      WHERE ol.id = onboarding_requests.link_id
        AND ol.admin_id = auth.uid()
    )
  );

-- client_platform_connections (onboarding flow uses anon + RLS permissive policies)
DROP POLICY IF EXISTS "Clients can view their own connections" ON public.client_platform_connections;
CREATE POLICY "Clients can view their own connections" ON public.client_platform_connections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can insert their own connections" ON public.client_platform_connections;
CREATE POLICY "Clients can insert their own connections" ON public.client_platform_connections
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Clients can update their own connections" ON public.client_platform_connections;
CREATE POLICY "Clients can update their own connections" ON public.client_platform_connections
  FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- 13. Backfill profiles for any auth users created before this migration (no-op on fresh DB)
-- -----------------------------------------------------------------------------
INSERT INTO public.users (id, email, role, full_name, company_name)
SELECT
  au.id,
  COALESCE(au.email, ''),
  CASE
    WHEN COALESCE(au.raw_user_meta_data->>'role', 'admin') IN ('admin', 'client')
      THEN COALESCE(au.raw_user_meta_data->>'role', 'admin')
    ELSE 'admin'
  END,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
    ''
  ),
  COALESCE(NULLIF(TRIM(au.raw_user_meta_data->>'company_name'), ''), '')
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Schema migration complete
-- -----------------------------------------------------------------------------
-- Verify:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--   SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
