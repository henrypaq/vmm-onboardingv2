import { supabaseAdmin } from '@/lib/supabase/server';

// Database interfaces matching the SQL schema
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  full_name?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  admin_id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_onboarding_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingLink {
  id: string;
  admin_id: string;
  client_id?: string;
  token: string;
  platforms: string[];
  requested_permissions: Record<string, string[]>;
  expires_at: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  is_used?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingRequest {
  id: string;
  link_id: string;
  client_id?: string;
  client_email?: string;
  client_name?: string;
  company_name?: string;
  granted_permissions: Record<string, string[]>;
  platform_connections: Record<string, Record<string, string>>;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPlatformConnection {
  id: string;
  admin_id: string;
  platform: 'meta' | 'google' | 'tiktok' | 'shopify';
  platform_user_id: string;
  platform_username?: string;
  access_token: string; // encrypted
  refresh_token?: string; // encrypted
  token_expires_at?: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User functions
export async function getUser(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }

  return data;
}

// Client functions
export async function getClients(adminId: string): Promise<Client[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data || [];
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data;
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert([client])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
  }

  return data;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }

  return data;
}

// Onboarding Link functions
export async function getOnboardingLinks(adminId: string): Promise<OnboardingLink[]> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_links')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching onboarding links:', error);
    return [];
  }

  return data || [];
}

export async function createOnboardingLink(link: Omit<OnboardingLink, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingLink> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_links')
    .insert([link])
    .select()
    .single();

  if (error) {
    console.error('Error creating onboarding link:', error);
    throw new Error('Failed to create onboarding link');
  }

  return data;
}

export async function getOnboardingLinkByToken(token: string): Promise<OnboardingLink | null> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_links')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    console.error('Error fetching onboarding link:', error);
    return null;
  }

  return data;
}

export async function updateOnboardingLink(id: string, updates: Partial<OnboardingLink>): Promise<OnboardingLink> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating onboarding link:', error);
    throw new Error('Failed to update onboarding link');
  }

  return data;
}

// Onboarding Request functions
export async function getOnboardingRequests(linkId?: string): Promise<OnboardingRequest[]> {
  let query = supabaseAdmin
    .from('onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (linkId) {
    query = query.eq('link_id', linkId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching onboarding requests:', error);
    return [];
  }

  return data || [];
}

export async function createOnboardingRequest(request: Omit<OnboardingRequest, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingRequest> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_requests')
    .insert([request])
    .select()
    .single();

  if (error) {
    console.error('Error creating onboarding request:', error);
    throw new Error('Failed to create onboarding request');
  }

  return data;
}

export async function updateOnboardingRequest(id: string, updates: Partial<OnboardingRequest>): Promise<OnboardingRequest> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating onboarding request:', error);
    throw new Error('Failed to update onboarding request');
  }

  return data;
}

// Admin Platform Connection functions
export async function getAdminPlatformConnections(adminId: string): Promise<AdminPlatformConnection[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_platform_connections')
    .select('*')
    .eq('admin_id', adminId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin platform connections:', error);
    return [];
  }

  return data || [];
}

export async function createAdminPlatformConnection(connection: Omit<AdminPlatformConnection, 'id' | 'created_at' | 'updated_at'>): Promise<AdminPlatformConnection> {
  const { data, error } = await supabaseAdmin
    .from('admin_platform_connections')
    .insert([connection])
    .select()
    .single();

  if (error) {
    console.error('Error creating admin platform connection:', error);
    throw new Error('Failed to create platform connection');
  }

  return data;
}

export async function updateAdminPlatformConnection(id: string, updates: Partial<AdminPlatformConnection>): Promise<AdminPlatformConnection> {
  const { data, error } = await supabaseAdmin
    .from('admin_platform_connections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating admin platform connection:', error);
    throw new Error('Failed to update platform connection');
  }

  return data;
}

export async function deleteAdminPlatformConnection(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_platform_connections')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting admin platform connection:', error);
    throw new Error('Failed to delete platform connection');
  }
}

export async function deleteAdminPlatformConnectionByAdminAndPlatform(adminId: string, platform: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_platform_connections')
    .update({ is_active: false })
    .eq('admin_id', adminId)
    .eq('platform', platform);

  if (error) {
    console.error('Error deleting admin platform connection:', error);
    throw new Error('Failed to delete platform connection');
  }
}

// Admin Account functions (new table)
export interface AdminAccount {
  id: string;
  admin_id: string;
  provider: 'google' | 'meta' | 'tiktok' | 'shopify';
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  scope: string[];
  provider_user_id?: string;
  provider_email?: string;
  provider_name?: string;
  created_at: string;
  updated_at: string;
}

export async function getAdminAccount(adminId: string, provider: string): Promise<AdminAccount | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('*')
    .eq('admin_id', adminId)
    .eq('provider', provider)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching admin account:', error);
    return null;
  }

  return data;
}

export async function getAllAdminAccounts(adminId: string): Promise<AdminAccount[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .select('*')
    .eq('admin_id', adminId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin accounts:', error);
    return [];
  }

  return data || [];
}

export async function createOrUpdateAdminAccount(account: Omit<AdminAccount, 'id' | 'created_at' | 'updated_at'>): Promise<AdminAccount> {
  // Use upsert to either insert or update
  const { data, error } = await supabaseAdmin
    .from('admin_accounts')
    .upsert([{
      ...account,
      updated_at: new Date().toISOString()
    }], {
      onConflict: 'admin_id,provider'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating admin account:', error);
    throw new Error('Failed to save admin account');
  }

  return data;
}

export async function deleteAdminAccount(adminId: string, provider: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('admin_accounts')
    .delete()
    .eq('admin_id', adminId)
    .eq('provider', provider);

  if (error) {
    console.error('Error deleting admin account:', error);
    throw new Error('Failed to delete admin account');
  }
}

export async function isAdminAccountValid(adminId: string, provider: string): Promise<boolean> {
  const account = await getAdminAccount(adminId, provider);
  
  if (!account) {
    return false;
  }

  // Check if token is expired
  if (account.expires_at) {
    const expiresAt = new Date(account.expires_at);
    const now = new Date();
    
    // Add 5 minute buffer before expiration
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiresAt <= bufferTime) {
      return false;
    }
  }

  return true;
}

// Utility functions
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    return !error;
  } catch (err) {
    console.error('Database connection check failed:', err);
    return false;
  }
}