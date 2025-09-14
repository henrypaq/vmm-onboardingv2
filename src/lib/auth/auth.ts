// Authentication utilities - placeholder for future Supabase integration

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  name?: string;
  createdAt: Date;
}

export interface AuthSession {
  user: User;
  expires: string;
}

// Placeholder authentication functions
export async function getServerSession(): Promise<AuthSession | null> {
  // TODO: Implement with Supabase auth
  return null;
}

export async function signIn(email: string, password: string): Promise<AuthSession | null> {
  // TODO: Implement with Supabase auth
  return null;
}

export async function signOut(): Promise<void> {
  // TODO: Implement with Supabase auth
}

export async function requireAuth(role?: 'admin' | 'client'): Promise<AuthSession> {
  // TODO: Implement with Supabase auth
  throw new Error('Authentication not implemented');
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export function isClient(user: User): boolean {
  return user.role === 'client';
}
