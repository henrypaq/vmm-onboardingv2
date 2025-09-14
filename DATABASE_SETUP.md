# Database Setup Guide

## ✅ **Supabase Connection Verified**

Your Supabase connection is working correctly! The credentials are valid and the project is accessible.

## 📋 **Next Steps: Create Database Schema**

### 1. **Access Supabase SQL Editor**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `offtqzjqjsdojmedaetv`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New Query"**

### 2. **Run the Database Schema Script**
Copy and paste the entire contents of `database-setup.sql` into the SQL Editor and click **"Run"**.

This will create:
- ✅ **5 main tables** with proper relationships
- ✅ **Row Level Security (RLS)** policies
- ✅ **Indexes** for performance
- ✅ **Triggers** for automatic timestamps
- ✅ **Sample data** for testing

### 3. **Verify Database Setup**
After running the SQL script, test the connection:

```bash
node test-db-connection.js
```

You should see:
```
✅ Database connection successful!
✅ Table 'users' is accessible
✅ Table 'admin_platform_connections' is accessible
✅ Table 'onboarding_links' is accessible
✅ Table 'onboarding_requests' is accessible
✅ Table 'clients' is accessible
```

## 🗄️ **Database Schema Overview**

### **Tables Created:**

1. **`users`** - User accounts (extends Supabase auth.users)
   - Links to Supabase authentication
   - Stores role (admin/client) and profile info

2. **`admin_platform_connections`** - Admin platform OAuth connections
   - Stores encrypted access tokens
   - Tracks platform permissions and status

3. **`onboarding_links`** - Generated onboarding links
   - UUID-based tokens with expiration
   - Platform and permission specifications

4. **`onboarding_requests`** - Client onboarding submissions
   - Links to onboarding links
   - Stores granted permissions and connections

5. **`clients`** - Client management for admins
   - Admin-specific client lists
   - Onboarding history tracking

### **Security Features:**
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Admin-only access** to platform connections and links
- ✅ **Client-specific data** isolation
- ✅ **Automatic user creation** on signup

### **Sample Data Included:**
- ✅ **Test admin user**: `admin@example.com`
- ✅ **Test client user**: `client@example.com`
- ✅ **Demo onboarding link**: `demo-token-12345`

## 🧪 **Testing the Setup**

### **1. Test Database Connection**
```bash
node test-db-connection.js
```

### **2. Test Application**
```bash
npm run dev -- --port 3002
```

Visit: **[http://localhost:3002](http://localhost:3002)**

### **3. Test Demo Flow**
Visit: **[http://localhost:3002/onboarding/demo-token-12345](http://localhost:3002/onboarding/demo-token-12345)**

## 🔧 **Environment Variables**

Your `.env.local` is already configured with:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 **Ready for Production**

Once the database schema is created:
1. **Deploy to Netlify** with GitHub integration
2. **Set up platform OAuth apps** with the redirect URIs
3. **Configure environment variables** in Netlify
4. **Test the complete flow** end-to-end

## 📞 **Need Help?**

If you encounter any issues:
1. Check the Supabase project is active
2. Verify the SQL script ran without errors
3. Run the connection test script
4. Check the Supabase logs for any errors

The database is now ready to support your complete Leadsie-style onboarding platform! 🎉
