# Onboarding Links Schema Analysis

## Code Expectations (from `src/lib/db/database.ts`):
```typescript
export interface OnboardingLink {
  id: string;                    // ✅ UUID primary key
  admin_id: string;              // ✅ UUID foreign key to users
  client_id?: string;            // ✅ Optional UUID foreign key to clients
  link_name?: string;            // ❌ MISSING - Descriptive name for the onboarding link
  token: string;                 // ✅ Text unique
  platforms: string[];           // ✅ Text array
  requested_permissions: Record<string, string[]>; // ✅ JSONB
  expires_at: string;            // ✅ Timestamptz
  status: 'pending' | 'in_progress' | 'completed' | 'expired'; // ✅ Text with check
  created_at: string;            // ✅ Timestamptz with default
  updated_at: string;            // ✅ Timestamptz with default
}
```

## Code Payload (from `src/app/api/links/generate/route.ts`):
```typescript
const linkData = {
  admin_id: '00000000-0000-0000-0000-000000000001',
  link_name: linkName,           // ❌ MISSING in database
  token: generatedLink.token,
  platforms: platforms,
  requested_permissions: requestedScopes || {},
  expires_at: generatedLink.expiresAt.toISOString(),
  status: 'pending' as const,
  // Note: client_id is intentionally omitted
  // Note: id, created_at, updated_at are auto-generated
};
```

## Database Schema (from SQL):
```sql
CREATE TABLE onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),        // ✅
  admin_id uuid NOT NULL REFERENCES users(id),          // ✅
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL, // ✅
  link_name text,                                        // ❌ MISSING from schema cache
  token text NOT NULL UNIQUE,                           // ✅
  platforms text[] NOT NULL DEFAULT '{}',               // ✅
  requested_permissions jsonb DEFAULT '{}',             // ✅
  expires_at timestamptz NOT NULL,                      // ✅
  status text NOT NULL CHECK (...) DEFAULT 'pending',   // ✅
  created_at timestamptz DEFAULT now(),                 // ✅
  updated_at timestamptz DEFAULT now()                  // ✅
);
```

## Issue:
The database schema cache doesn't recognize the `link_name` column, even though it's defined in the SQL. This suggests the SQL hasn't been run yet or there's a caching issue.

## Solution:
Need to run the complete SQL to refresh the schema cache and ensure all columns are properly recognized.
