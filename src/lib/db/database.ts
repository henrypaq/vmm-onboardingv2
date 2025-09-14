import { supabaseAdmin } from '@/lib/supabase/server';

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface OnboardingLink {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  created_by: string; // admin user id
  platforms: string[]; // ['meta', 'google', 'tiktok', 'shopify']
  requested_permissions: Record<string, string[]>; // { platform: [permissions] }
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
}

export interface OnboardingRequest {
  id: string;
  client_id: string;
  link_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  granted_permissions: Record<string, string[]>; // { platform: [granted_permissions] }
  platform_connections: Record<string, any>; // { platform: connection_data }
  data: Record<string, any>;
  submitted_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface AdminPlatformConnection {
  id: string;
  admin_id: string;
  platform: 'meta' | 'google' | 'tiktok' | 'shopify';
  platform_user_id: string;
  platform_username: string;
  access_token: string; // encrypted
  refresh_token?: string; // encrypted
  token_expires_at?: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database functions using Supabase
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
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

export async function getOnboardingLinks(): Promise<OnboardingLink[]> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching onboarding links:', error);
    return [];
  }

  return data || [];
}

export async function createOnboardingLink(link: Omit<OnboardingLink, 'id' | 'created_at'>): Promise<OnboardingLink> {
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

export async function getOnboardingRequests(): Promise<OnboardingRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching onboarding requests:', error);
    return [];
  }

  return data || [];
}

export async function createOnboardingRequest(request: Omit<OnboardingRequest, 'id' | 'created_at'>): Promise<OnboardingRequest> {
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
