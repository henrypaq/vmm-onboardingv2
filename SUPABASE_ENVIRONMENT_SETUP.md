# Supabase Environment Setup Guide

This guide explains how to properly configure Supabase environment variables for both localhost development and Netlify deployment.

## Required Environment Variables

### For Client-Side Code (Browser)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe for client-side)

### For Server-Side Code (API Routes)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (same as client)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

## Localhost Setup

1. Create a `.env.local` file in your project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. Restart your development server:
```bash
npm run dev
```

## Netlify Setup

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** > **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key-here` | Supabase service role key |

4. Redeploy your site

## Security Notes

- ✅ **Safe for client-side**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ **Never expose**: `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- ✅ **Automatic warnings**: The app will show console warnings if variables are missing

## Troubleshooting

### Missing Environment Variables
If you see console warnings like:
```
⚠️  NEXT_PUBLIC_SUPABASE_URL is missing
```

**For localhost:**
- Check your `.env.local` file exists and has the correct variables
- Restart your development server

**For Netlify:**
- Check Site Settings > Environment Variables
- Redeploy your site after adding variables

### Common Issues

1. **Variables not updating on Netlify**
   - Solution: Redeploy your site after adding environment variables

2. **"supabaseKey is required" error**
   - Solution: Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is properly set

3. **Database connection errors**
   - Solution: Check that `SUPABASE_SERVICE_ROLE_KEY` is set for server-side operations

## File Structure

```
src/
├── lib/
│   ├── supabaseClient.ts          # Client-side Supabase client
│   └── 2/
│       └── supabase/
│           ├── client.ts          # Alternative client-side client
│           └── server.ts          # Server-side Supabase client
└── app/
    └── api/                       # Server-side API routes
```

## Usage Examples

### Client-Side Components
```typescript
import { supabase } from '@/lib/supabaseClient';

// Use supabase for client-side operations
const { data, error } = await supabase.from('table').select('*');
```

### Server-Side API Routes
```typescript
import { supabaseAdmin } from '@/lib 2/supabase/server';

// Use supabaseAdmin for server-side operations
const { data, error } = await supabaseAdmin.from('table').select('*');
```
