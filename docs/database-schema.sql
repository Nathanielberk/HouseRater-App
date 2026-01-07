-- HouseRater Database Schema
-- This script creates all tables, indexes, and security policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table 1: households
-- ============================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 2: household_users
-- ============================================
CREATE TABLE household_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(household_id, email),
  UNIQUE(auth_user_id)
);

-- Add constraint: Maximum 8 users per household
CREATE OR REPLACE FUNCTION check_household_user_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM household_users WHERE household_id = NEW.household_id) >= 8 THEN
    RAISE EXCEPTION 'Household cannot have more than 8 users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_household_user_limit
  BEFORE INSERT ON household_users
  FOR EACH ROW
  EXECUTE FUNCTION check_household_user_limit();

-- Add constraint: Maximum 2 owners per household
CREATE OR REPLACE FUNCTION check_household_owner_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'owner' AND
     (SELECT COUNT(*) FROM household_users
      WHERE household_id = NEW.household_id AND role = 'owner') >= 2 THEN
    RAISE EXCEPTION 'Household cannot have more than 2 owners';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_household_owner_limit
  BEFORE INSERT OR UPDATE ON household_users
  FOR EACH ROW
  EXECUTE FUNCTION check_household_owner_limit();

-- ============================================
-- Table 3: categories
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_group TEXT NOT NULL CHECK (category_group IN ('features', 'size', 'neighborhood', 'transportation', 'yard', 'custom')),
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(household_id, name)
);

-- ============================================
-- Table 4: category_weights
-- ============================================
CREATE TABLE category_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_user_id UUID NOT NULL REFERENCES household_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(household_user_id, category_id)
);

-- ============================================
-- Table 5: houses
-- ============================================
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  nickname TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  price DECIMAL(12, 2),
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 6: house_ratings
-- ============================================
CREATE TABLE house_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  household_user_id UUID NOT NULL REFERENCES household_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  nickname TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(house_id, household_user_id, category_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_household_users_household ON household_users(household_id);
CREATE INDEX idx_household_users_auth ON household_users(auth_user_id);
CREATE INDEX idx_categories_household ON categories(household_id);
CREATE INDEX idx_categories_active ON categories(household_id, is_active);
CREATE INDEX idx_category_weights_user ON category_weights(household_user_id);
CREATE INDEX idx_category_weights_category ON category_weights(category_id);
CREATE INDEX idx_houses_household ON houses(household_id);
CREATE INDEX idx_house_ratings_house ON house_ratings(house_id);
CREATE INDEX idx_house_ratings_user ON house_ratings(household_user_id);
CREATE INDEX idx_house_ratings_category ON house_ratings(category_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_ratings ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's household_id
CREATE OR REPLACE FUNCTION get_user_household_id(user_id UUID)
RETURNS UUID AS $$
  SELECT household_id FROM household_users WHERE auth_user_id = user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policy: households
CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (id = get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their own household"
  ON households FOR UPDATE
  USING (id = get_user_household_id(auth.uid()));

-- RLS Policy: household_users
CREATE POLICY "Users can view members of their household"
  ON household_users FOR SELECT
  USING (household_id = get_user_household_id(auth.uid()));

CREATE POLICY "Owners can insert users into their household"
  ON household_users FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can update users in their household"
  ON household_users FOR UPDATE
  USING (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can delete users from their household"
  ON household_users FOR DELETE
  USING (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policy: categories
CREATE POLICY "Users can view categories in their household"
  ON categories FOR SELECT
  USING (household_id = get_user_household_id(auth.uid()));

CREATE POLICY "Owners can manage categories"
  ON categories FOR ALL
  USING (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policy: category_weights
CREATE POLICY "Users can view category weights in their household"
  ON category_weights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_users
      WHERE id = household_user_id AND household_id = get_user_household_id(auth.uid())
    )
  );

CREATE POLICY "Users can manage their own category weights"
  ON category_weights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_users
      WHERE id = household_user_id AND auth_user_id = auth.uid()
    )
  );

-- RLS Policy: houses
CREATE POLICY "Users can view houses in their household"
  ON houses FOR SELECT
  USING (household_id = get_user_household_id(auth.uid()));

CREATE POLICY "Users can manage houses in their household"
  ON houses FOR ALL
  USING (household_id = get_user_household_id(auth.uid()));

-- RLS Policy: house_ratings
CREATE POLICY "Users can view house ratings in their household"
  ON house_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_users
      WHERE id = household_user_id AND household_id = get_user_household_id(auth.uid())
    )
  );

CREATE POLICY "Users can manage their own house ratings"
  ON house_ratings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM household_users
      WHERE id = household_user_id AND auth_user_id = auth.uid()
    )
  );

-- ============================================
-- Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_household_users_updated_at BEFORE UPDATE ON household_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_weights_updated_at BEFORE UPDATE ON category_weights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_house_ratings_updated_at BEFORE UPDATE ON house_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
