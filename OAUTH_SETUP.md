# OAuth Setup Guide for Platform Integrations

This document outlines the redirect URIs and setup requirements for connecting to Meta, Google, TikTok, and Shopify platforms.

## Redirect URIs for Platform Apps

### Admin Dashboard Connections
These URIs are used when admins connect their platform accounts in the settings:

#### Meta (Facebook)
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/admin/connect/meta`
- **Scopes**: `pages_read_engagement,pages_manage_posts,ads_read,pages_show_list`

#### Google
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/admin/connect/google`
- **Scopes**: `https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords`

#### TikTok
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/admin/connect/tiktok`
- **Scopes**: `user.info.basic,video.list`

#### Shopify
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/admin/connect/shopify`
- **Scopes**: `read_orders,read_products,read_customers`

### Client Onboarding Connections
These URIs are used when clients connect their platform accounts during the onboarding flow:

#### Meta (Facebook)
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/client/connect/meta`
- **Scopes**: `pages_read_engagement,pages_manage_posts,ads_read,pages_show_list`

#### Google
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/client/connect/google`
- **Scopes**: `https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/adwords`

#### TikTok
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/client/connect/tiktok`
- **Scopes**: `user.info.basic,video.list`

#### Shopify
- **Redirect URI**: `https://your-app.netlify.app/api/oauth/client/connect/shopify`
- **Scopes**: `read_orders,read_products,read_customers`

## Environment Variables Required

Add these to your Netlify environment variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Meta (Facebook)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Shopify
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_SHOP_DOMAIN=your_shop_domain
```

## Platform App Setup Instructions

### 1. Meta (Facebook) App Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add Facebook Login product
4. Add these redirect URIs:
   - `https://your-app.netlify.app/api/oauth/admin/connect/meta`
   - `https://your-app.netlify.app/api/oauth/client/connect/meta`
5. Request required permissions: `pages_read_engagement`, `pages_manage_posts`, `ads_read`, `pages_show_list`

### 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Analytics API and Google Ads API
4. Create OAuth 2.0 credentials
5. Add these redirect URIs:
   - `https://your-app.netlify.app/api/oauth/admin/connect/google`
   - `https://your-app.netlify.app/api/oauth/client/connect/google`

### 3. TikTok for Developers Setup
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Add these redirect URIs:
   - `https://your-app.netlify.app/api/oauth/admin/connect/tiktok`
   - `https://your-app.netlify.app/api/oauth/client/connect/tiktok`
4. Request required scopes: `user.info.basic`, `video.list`

### 4. Shopify Partner Dashboard Setup
1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Add these redirect URIs:
   - `https://your-app.netlify.app/api/oauth/admin/connect/shopify`
   - `https://your-app.netlify.app/api/oauth/client/connect/shopify`
4. Request required scopes: `read_orders`, `read_products`, `read_customers`

## API Endpoints Structure

### Admin OAuth Flow
```
GET /api/oauth/admin/connect/[platform]
```
- Initiates OAuth flow for admin platform connection
- Redirects to platform OAuth page
- Handles callback and stores admin credentials

### Client OAuth Flow
```
GET /api/oauth/client/connect/[platform]?token=[onboarding_token]
```
- Initiates OAuth flow for client platform connection
- Requires onboarding token for context
- Handles callback and stores client permissions

## Next Steps

1. **Deploy to Netlify** using GitHub integration
2. **Set up platform apps** with the redirect URIs above
3. **Configure environment variables** in Netlify dashboard
4. **Test OAuth flows** for each platform
5. **Implement token exchange** and database storage
6. **Add error handling** and user feedback

## Testing

Use the demo onboarding flow at:
`https://your-app.netlify.app/onboarding/demo-token-12345`

This will test the complete client onboarding experience with all platform connections.
