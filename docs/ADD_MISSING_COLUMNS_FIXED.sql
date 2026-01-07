-- Add all missing columns to the houses table (PostgreSQL compatible)
-- This migration adds the property detail columns that were missing from the initial schema

-- Add columns (with IF NOT EXISTS for safety)
ALTER TABLE houses ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS bathrooms NUMERIC(3,1);
ALTER TABLE houses ADD COLUMN IF NOT EXISTS square_feet INTEGER;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS lot_size_sqft INTEGER;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS listing_url TEXT;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE houses ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_houses_price ON houses(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_bedrooms ON houses(bedrooms) WHERE bedrooms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_property_type ON houses(property_type) WHERE property_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_year_built ON houses(year_built) WHERE year_built IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_is_active ON houses(is_active);
CREATE INDEX IF NOT EXISTS idx_houses_household_active ON houses(household_id, is_active);

-- Add data validation constraints (drop first if exists, then recreate)
DO $$
BEGIN
  -- Drop constraints if they exist
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_bedrooms_positive;
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_bathrooms_positive;
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_square_feet_positive;
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_lot_size_positive;
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_year_built_reasonable;
  ALTER TABLE houses DROP CONSTRAINT IF EXISTS chk_price_positive;

  -- Add constraints
  ALTER TABLE houses ADD CONSTRAINT chk_bedrooms_positive
    CHECK (bedrooms IS NULL OR (bedrooms >= 0 AND bedrooms <= 20));
  ALTER TABLE houses ADD CONSTRAINT chk_bathrooms_positive
    CHECK (bathrooms IS NULL OR (bathrooms >= 0 AND bathrooms <= 10));
  ALTER TABLE houses ADD CONSTRAINT chk_square_feet_positive
    CHECK (square_feet IS NULL OR square_feet > 0);
  ALTER TABLE houses ADD CONSTRAINT chk_lot_size_positive
    CHECK (lot_size_sqft IS NULL OR lot_size_sqft > 0);
  ALTER TABLE houses ADD CONSTRAINT chk_year_built_reasonable
    CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= 2100));
  ALTER TABLE houses ADD CONSTRAINT chk_price_positive
    CHECK (price IS NULL OR price > 0);

  RAISE NOTICE 'Successfully added all missing columns and constraints to houses table';
END $$;
