import { v4 as uuidv4 } from 'uuid';

export interface LinkGenerationOptions {
  clientId: string;
  expiresInDays?: number;
  createdBy: string;
}

export interface GeneratedLink {
  token: string;
  url: string;
  expiresAt: Date;
}

/**
 * Generate a unique onboarding link for a client
 */
export function generateOnboardingLink(options: LinkGenerationOptions): GeneratedLink {
  const token = uuidv4();
  const expiresInDays = options.expiresInDays || 7; // Default 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  // In production, this would use the actual domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/onboarding/${token}`;
  
  return {
    token,
    url,
    expiresAt,
  };
}

/**
 * Validate if a link token is still valid
 * Links can be used multiple times, so we only check expiration
 */
export function isLinkValid(expiresAt: Date): boolean {
  return new Date() < expiresAt;
}

/**
 * Generate a short, shareable link ID (for display purposes)
 */
export function generateShortLinkId(token: string): string {
  return token.substring(0, 8).toUpperCase();
}
