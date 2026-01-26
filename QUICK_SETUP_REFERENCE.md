# Quick Setup Reference Card

## 🚀 Fast Setup (5 Minutes)

### 1. Create New Supabase Project
- Go to: https://supabase.com/dashboard
- Click "New Project"
- Save your credentials

### 2. Update Environment Variables
```bash
node setup-new-supabase.js
```
Or manually edit `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Database Schema
- Open Supabase SQL Editor
- Copy/paste entire `complete-database-definitive-updated.sql`
- Click "Run"

### 4. Verify Setup
```bash
node verify-new-supabase-setup.js
```

### 5. Test Application
```bash
npm run dev
```

---

## 📋 Required Files

- ✅ `complete-database-definitive-updated.sql` - Database schema
- ✅ `.env.local` - Environment variables
- ✅ `setup-new-supabase.js` - Setup helper
- ✅ `verify-new-supabase-setup.js` - Verification script

---

## 🔑 Where to Find Supabase Credentials

1. Supabase Dashboard → Your Project
2. Settings (⚙️) → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Verification Checklist

- [ ] New Supabase project created
- [ ] `.env.local` updated with new credentials
- [ ] Database schema script run successfully
- [ ] Verification script passes
- [ ] Can sign up new user
- [ ] Can login
- [ ] Admin dashboard works

---

## 🆘 Quick Troubleshooting

**"Missing environment variables"**
→ Run `node setup-new-supabase.js`

**"Table doesn't exist"**
→ Run `complete-database-definitive-updated.sql` in SQL Editor

**"Connection failed"**
→ Check credentials in `.env.local` and restart dev server

---

For detailed instructions, see: `NEW_SUPABASE_SETUP.md`
