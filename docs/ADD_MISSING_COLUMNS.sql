-- Add all missing columns to the houses table
-- This migration adds the property detail columns that were missing from the initial schema

-- 1. Add bedrooms column (integer, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS bedrooms INTEGER;

-- 2. Add bathrooms column (numeric for half baths like 2.5)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS bathrooms NUMERIC(3,1);

-- 3. Add square_feet column (integer, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS square_feet INTEGER;

-- 4. Add lot_size_sqft column (integer, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS lot_size_sqft INTEGER;

-- 5. Add year_built column (integer, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS year_built INTEGER;

-- 6. Add property_type column (text, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS property_type TEXT;

-- 7. Add listing_url column (text, nullable)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS listing_url TEXT;

-- 8. Add nickname column (text, nullable) - for user-friendly house names
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 9. Add image_urls column (text array for future multiple images)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Confirm the is_active column exists (from previous migration)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add helpful indexes for common queries
CREATE INDEX IF NOT EXISTS idx_houses_price ON houses(price) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_bedrooms ON houses(bedrooms) WHERE bedrooms IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_property_type ON houses(property_type) WHERE property_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_houses_year_built ON houses(year_built) WHERE year_built IS NOT NULL;

-- Add check constraints for data validation
ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_bedrooms_positive
CHECK (bedrooms IS NULL OR (bedrooms >= 0 AND bedrooms <= 20));

ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_bathrooms_positive
CHECK (bathrooms IS NULL OR (bathrooms >= 0 AND bathrooms <= 10));

ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_square_feet_positive
CHECK (square_feet IS NULL OR square_feet > 0);

ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_lot_size_positive
CHECK (lot_size_sqft IS NULL OR lot_size_sqft > 0);

ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_year_built_reasonable
CHECK (year_built IS NULL OR (year_built >= 1800 AND year_built <= 2100));

ALTER TABLE houses
ADD CONSTRAINT IF NOT EXISTS chk_price_positive
CHECK (price IS NULL OR price > 0);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added all missing columns to houses table';
  RAISE NOTICE 'Columns added: bedrooms, bathrooms, square_feet, lot_size_sqft, year_built, property_type, listing_url, nickname, image_urls, is_active';
  RAISE NOTICE 'Indexes created for better query performance';
  RAISE NOTICE 'Data validation constraints added';
END $$;
