-- =====================================================
-- TROUBLESHOOTING SQL - Run this first to check current state
-- =====================================================
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if onboarding_links table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'onboarding_links';

-- 2. Check current columns in onboarding_links table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
ORDER BY ordinal_position;

-- 3. Check if link_name column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'onboarding_links' 
AND column_name = 'link_name';

-- 4. Show all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
