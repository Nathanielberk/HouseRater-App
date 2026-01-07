-- Simple RLS Fix - Run this in Supabase SQL Editor
-- This completely replaces the problematic policies

-- 1. DISABLE RLS temporarily to clean up
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_users DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL existing policies
DROP POLICY IF EXISTS "Users can view their own household" ON households;
DROP POLICY IF EXISTS "Users can update their own household" ON households;
DROP POLICY IF EXISTS "Users can insert households" ON households;
DROP POLICY IF EXISTS "Users can delete their own household" ON households;

DROP POLICY IF EXISTS "Users can view members of their household" ON household_users;
DROP POLICY IF EXISTS "Owners can insert users into their household" ON household_users;
DROP POLICY IF EXISTS "Owners can update users in their household" ON household_users;
DROP POLICY IF EXISTS "Owners can delete users from their household" ON household_users;
DROP POLICY IF EXISTS "Users can insert themselves into a household" ON household_users;
DROP POLICY IF EXISTS "Owners can insert other users into their household" ON household_users;

-- 3. RE-ENABLE RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_users ENABLE ROW LEVEL SECURITY;

-- 4. CREATE NEW SIMPLE POLICIES

-- HOUSEHOLDS: Allow authenticated users to do everything
CREATE POLICY "Authenticated users can insert households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view households"
  ON households FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update households"
  ON households FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete households"
  ON households FOR DELETE
  TO authenticated
  USING (true);

-- HOUSEHOLD_USERS: Allow authenticated users to do everything
CREATE POLICY "Authenticated users can insert household_users"
  ON household_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view household_users"
  ON household_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update household_users"
  ON household_users FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete household_users"
  ON household_users FOR DELETE
  TO authenticated
  USING (true);

-- NOTE: These are permissive policies for development/testing.
-- For production, you would add proper filters based on household_id
-- to ensure users can only see/modify their own household data.
