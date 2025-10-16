import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

/**
 * Standardized API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

/**
 * Get Supabase admin client with error handling
 */
export async function getSupabaseClient() {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.error('[API Utils] Failed to create Supabase client:', error);
    throw new Error('Database connection failed');
  }
}

/**
 * Execute Supabase operation with standardized error handling
 */
export async function executeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string
): Promise<T> {
  try {
    const result = await operation();
    
    if (result.error) {
      console.error(`[API Utils] ${operationName} failed:`, result.error);
      throw new Error(`${operationName} failed: ${result.error.message || 'Unknown error'}`);
    }
    
    if (result.data === null) {
      throw new Error(`${operationName} returned null data`);
    }
    
    return result.data;
  } catch (error) {
    console.error(`[API Utils] ${operationName} exception:`, error);
    throw error;
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Extract platform from request with validation
 */
export function extractPlatformFromRequest(request: Request): string {
  const url = new URL(request.url);
  const platform = url.searchParams.get('platform');
  
  if (!platform) {
    throw new Error('Platform parameter is required');
  }
  
  const validPlatforms = ['meta', 'google', 'shopify', 'tiktok'];
  if (!validPlatforms.includes(platform)) {
    throw new Error(`Invalid platform: ${platform}. Must be one of: ${validPlatforms.join(', ')}`);
  }
  
  return platform;
}

/**
 * Extract client ID from request with validation
 */
export function extractClientIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  
  if (!clientId) {
    throw new Error('Client ID parameter is required');
  }
  
  return clientId;
}

/**
 * Safe JSON parsing with error handling
 */
export async function safeJsonParse<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Log API operation start
 */
export function logApiStart(operation: string, params?: Record<string, any>): void {
  console.log(`[API] ${operation} started`, params ? { params } : '');
}

/**
 * Log API operation success
 */
export function logApiSuccess(operation: string, result?: any): void {
  console.log(`[API] ${operation} completed successfully`, result ? { result } : '');
}

/**
 * Log API operation error
 */
export function logApiError(operation: string, error: any): void {
  console.error(`[API] ${operation} failed:`, error);
}

/**
 * Handle API route with standardized error handling
 */
export async function handleApiRoute<T>(
  operation: string,
  handler: () => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    logApiStart(operation);
    const result = await handler();
    logApiSuccess(operation, result);
    return createSuccessResponse(result);
  } catch (error) {
    logApiError(operation, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(errorMessage, 500);
  }
}
