# Permanent Links Setup

This document explains how to set up the two permanent onboarding links: **Manage Link** (disabled/coming soon) and **View Link** (active with all scopes).

## Overview

The application now supports two special permanent links:

1. **Manage Link** (`manage-permanent-link`):
   - Currently disabled/greyed out in the UI
   - Shows "Coming Soon" status
   - Cannot be deleted
   - Reserved for future admin management functionality

2. **View Link** (`view-permanent-link`):
   - Fully functional universal onboarding link
   - Requests all available scopes from all platforms (Meta, Google, TikTok, Shopify)
   - Cannot be deleted
   - Expires in 10 years (effectively permanent)

## Installation

### Step 1: Run the SQL Script

Connect to your Supabase database and run the SQL script:

```bash
# If using Supabase CLI
supabase db push

# Or manually through Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy and paste the contents of create-permanent-links.sql
# 3. Run the query
```

Alternatively, run the script directly:

```sql
-- Copy the contents from create-permanent-links.sql
```

### Step 2: Verify Installation

After running the script, verify the links were created:

```sql
SELECT 
  id,
  link_name,
  token,
  platforms,
  status,
  expires_at,
  created_at
FROM onboarding_links
WHERE token IN ('manage-permanent-link', 'view-permanent-link')
ORDER BY token;
```

You should see two links:
- `manage-permanent-link` with status `expired` (greyed out)
- `view-permanent-link` with status `pending` (active)

## Features

### UI Behavior

1. **Links Page Top Section**:
   - Shows both Manage and View links in colored boxes
   - Manage Link box is greyed out with "Coming Soon" label
   - View Link box is active and fully functional

2. **Custom Links List**:
   - Both permanent links appear in the list
   - Manage Link appears greyed out (50% opacity)
   - Delete button is hidden for both permanent links

3. **Protection**:
   - Permanent links cannot be deleted through the UI
   - Attempting to delete will show an alert message
   - Backend should also protect against deletion (recommended)

### Scopes Included

The View Link requests comprehensive scopes from all platforms:

**Meta (Facebook/Instagram)**:
- Pages management and insights
- Instagram content and engagement
- Ads management
- Business management

**Google**:
- Analytics (read-only)
- AdWords/Google Ads
- Google My Business
- Search Console (read-only)
- YouTube (read-only)

**TikTok**:
- User profile information
- User statistics
- Video list and insights

**Shopify**:
- Products (read)
- Orders (read)
- Customers (read)
- Analytics and reports (read)

## Customization

To modify the scopes or add new platforms:

1. Edit `create-permanent-links.sql`
2. Update the `requested_permissions` JSON for the desired link
3. Re-run the script (it uses `ON CONFLICT ... DO UPDATE` for safety)

## Removal (Not Recommended)

If you need to remove the permanent links:

```sql
DELETE FROM onboarding_links
WHERE token IN ('manage-permanent-link', 'view-permanent-link');
```

**Note**: This will break the UI if the links are expected. Only do this if you're also removing the feature from the frontend.

## Future Development

The Manage Link is reserved for future functionality that may include:
- Editing existing links
- Managing link permissions
- Viewing link analytics
- Bulk operations on links

When this functionality is ready, simply update the link's status from `expired` to `pending` in the database, and remove the disabled state check from the frontend code.

