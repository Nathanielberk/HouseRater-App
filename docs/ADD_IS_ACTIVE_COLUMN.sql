-- Add is_active column to houses table for archive/restore functionality
-- This allows soft deletion instead of permanently removing houses

-- Add the column with default value of true (all existing houses are active)
ALTER TABLE houses
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add an index for better query performance when filtering by is_active
CREATE INDEX IF NOT EXISTS idx_houses_is_active ON houses(is_active);

-- Add a composite index for household_id + is_active (common query pattern)
CREATE INDEX IF NOT EXISTS idx_houses_household_active ON houses(household_id, is_active);

-- Update any existing houses to be active (safety measure)
UPDATE houses SET is_active = true WHERE is_active IS NULL;
