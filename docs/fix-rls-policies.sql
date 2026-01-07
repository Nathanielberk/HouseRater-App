-- Fix RLS Policies to Allow Household Creation
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own household" ON households;
DROP POLICY IF EXISTS "Users can update their own household" ON households;

-- Create new policies that allow creation
CREATE POLICY "Users can insert households"
  ON households FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Any authenticated user can create a household

CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  TO authenticated
  USING (id = get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their own household"
  ON households FOR UPDATE
  TO authenticated
  USING (id = get_user_household_id(auth.uid()));

CREATE POLICY "Users can delete their own household"
  ON households FOR DELETE
  TO authenticated
  USING (
    id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE household_id = id AND auth_user_id = auth.uid() AND role = 'owner'
    )
  );

-- Also fix household_users policies to allow self-insertion during signup
DROP POLICY IF EXISTS "Owners can insert users into their household" ON household_users;

CREATE POLICY "Users can insert themselves into a household"
  ON household_users FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());  -- Can only insert yourself

CREATE POLICY "Owners can insert other users into their household"
  ON household_users FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );
