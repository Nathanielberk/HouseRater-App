-- Complete RLS Fix for ALL Tables - Run this in Supabase SQL Editor
-- This fixes RLS policies for all 6 tables in the database

-- ==================================================
-- STEP 1: DISABLE RLS on all tables
-- ==================================================
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE category_weights DISABLE ROW LEVEL SECURITY;
ALTER TABLE houses DISABLE ROW LEVEL SECURITY;
ALTER TABLE house_ratings DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 2: DROP ALL existing policies
-- ==================================================

-- households policies
DROP POLICY IF EXISTS "Users can view their own household" ON households;
DROP POLICY IF EXISTS "Users can update their own household" ON households;
DROP POLICY IF EXISTS "Users can insert households" ON households;
DROP POLICY IF EXISTS "Users can delete their own household" ON households;
DROP POLICY IF EXISTS "Authenticated users can insert households" ON households;
DROP POLICY IF EXISTS "Authenticated users can view households" ON households;
DROP POLICY IF EXISTS "Authenticated users can update households" ON households;
DROP POLICY IF EXISTS "Authenticated users can delete households" ON households;

-- household_users policies
DROP POLICY IF EXISTS "Users can view members of their household" ON household_users;
DROP POLICY IF EXISTS "Owners can insert users into their household" ON household_users;
DROP POLICY IF EXISTS "Owners can update users in their household" ON household_users;
DROP POLICY IF EXISTS "Owners can delete users from their household" ON household_users;
DROP POLICY IF EXISTS "Users can insert themselves into a household" ON household_users;
DROP POLICY IF EXISTS "Owners can insert other users into their household" ON household_users;
DROP POLICY IF EXISTS "Authenticated users can insert household_users" ON household_users;
DROP POLICY IF EXISTS "Authenticated users can view household_users" ON household_users;
DROP POLICY IF EXISTS "Authenticated users can update household_users" ON household_users;
DROP POLICY IF EXISTS "Authenticated users can delete household_users" ON household_users;

-- categories policies
DROP POLICY IF EXISTS "Users can view categories in their household" ON categories;
DROP POLICY IF EXISTS "Owners can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

-- category_weights policies
DROP POLICY IF EXISTS "Users can view category weights in their household" ON category_weights;
DROP POLICY IF EXISTS "Users can manage their own category weights" ON category_weights;
DROP POLICY IF EXISTS "Authenticated users can insert category_weights" ON category_weights;
DROP POLICY IF EXISTS "Authenticated users can view category_weights" ON category_weights;
DROP POLICY IF EXISTS "Authenticated users can update category_weights" ON category_weights;
DROP POLICY IF EXISTS "Authenticated users can delete category_weights" ON category_weights;

-- houses policies
DROP POLICY IF EXISTS "Users can view houses in their household" ON houses;
DROP POLICY IF EXISTS "Users can manage houses in their household" ON houses;
DROP POLICY IF EXISTS "Authenticated users can insert houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can view houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can update houses" ON houses;
DROP POLICY IF EXISTS "Authenticated users can delete houses" ON houses;

-- house_ratings policies
DROP POLICY IF EXISTS "Users can view house ratings in their household" ON house_ratings;
DROP POLICY IF EXISTS "Users can manage their own house ratings" ON house_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert house_ratings" ON house_ratings;
DROP POLICY IF EXISTS "Authenticated users can view house_ratings" ON house_ratings;
DROP POLICY IF EXISTS "Authenticated users can update house_ratings" ON house_ratings;
DROP POLICY IF EXISTS "Authenticated users can delete house_ratings" ON house_ratings;

-- ==================================================
-- STEP 3: RE-ENABLE RLS on all tables
-- ==================================================
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_ratings ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- STEP 4: CREATE PERMISSIVE POLICIES FOR ALL TABLES
-- ==================================================

-- HOUSEHOLDS: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert households"
  ON households FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view households"
  ON households FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update households"
  ON households FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete households"
  ON households FOR DELETE TO authenticated USING (true);

-- HOUSEHOLD_USERS: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert household_users"
  ON household_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view household_users"
  ON household_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update household_users"
  ON household_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete household_users"
  ON household_users FOR DELETE TO authenticated USING (true);

-- CATEGORIES: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE TO authenticated USING (true);

-- CATEGORY_WEIGHTS: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert category_weights"
  ON category_weights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view category_weights"
  ON category_weights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update category_weights"
  ON category_weights FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete category_weights"
  ON category_weights FOR DELETE TO authenticated USING (true);

-- HOUSES: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert houses"
  ON houses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view houses"
  ON houses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update houses"
  ON houses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete houses"
  ON houses FOR DELETE TO authenticated USING (true);

-- HOUSE_RATINGS: Allow authenticated users full access
CREATE POLICY "Authenticated users can insert house_ratings"
  ON house_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can view house_ratings"
  ON house_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update house_ratings"
  ON house_ratings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete house_ratings"
  ON house_ratings FOR DELETE TO authenticated USING (true);

-- ==================================================
-- VERIFICATION
-- ==================================================
-- Run this to verify all policies were created:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- You should see 4 policies per table (24 total):
-- - Authenticated users can insert [table]
-- - Authenticated users can view [table]
-- - Authenticated users can update [table]
-- - Authenticated users can delete [table]
