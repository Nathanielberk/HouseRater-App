-- Seed Default Categories for HouseRater
-- This script inserts the 29 default categories for a household
-- Replace 'HOUSEHOLD_ID_HERE' with the actual household UUID

-- This function will be called when a new household is created
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS void AS $$
BEGIN
  -- Features (10 categories)
  INSERT INTO categories (household_id, name, category_group, is_default, display_order, is_active) VALUES
  (p_household_id, 'Bathtub (normal size)', 'features', true, 1, true),
  (p_household_id, 'Kitchen & Dining Proximity', 'features', true, 2, true),
  (p_household_id, 'Hardwood floors in Living and Bedrooms', 'features', true, 3, true),
  (p_household_id, 'Good Natural Lighting', 'features', true, 4, true),
  (p_household_id, 'Gas Fireplace', 'features', true, 5, true),
  (p_household_id, '9 ft Ceilings or higher', 'features', true, 6, true),
  (p_household_id, 'Views From Living Spaces', 'features', true, 7, true),
  (p_household_id, 'Air Conditioning', 'features', true, 8, true),
  (p_household_id, 'Craftsman Style', 'features', true, 9, true),
  (p_household_id, 'Bar Seating', 'features', true, 10, true);

  -- Size (10 categories)
  INSERT INTO categories (household_id, name, category_group, is_default, display_order, is_active) VALUES
  (p_household_id, 'Large & Functional Kitchen', 'size', true, 11, true),
  (p_household_id, '3 Bedrooms (as actual Bedrooms)', 'size', true, 12, true),
  (p_household_id, 'Workspace for both N + J', 'size', true, 13, true),
  (p_household_id, 'Dining Room fits our Table', 'size', true, 14, true),
  (p_household_id, 'Ample Storage (seasonal gear/decor)', 'size', true, 15, true),
  (p_household_id, 'Den / Alcove Space (reading, gaming, or tv)', 'size', true, 16, true),
  (p_household_id, 'Space for 2nd Freezer', 'size', true, 17, true),
  (p_household_id, 'MiL Dwelling (add Income or MiL)', 'size', true, 18, true),
  (p_household_id, '2nd half+ bathroom (second toilet + sink)', 'size', true, 19, true),
  (p_household_id, '2nd full bathroom (second shower/bath)', 'size', true, 20, true);

  -- Neighborhood (7 categories)
  INSERT INTO categories (household_id, name, category_group, is_default, display_order, is_active) VALUES
  (p_household_id, 'Proximity to school', 'neighborhood', true, 21, true),
  (p_household_id, 'Walkable to Market/Groceries', 'neighborhood', true, 22, true),
  (p_household_id, '8-10 rated Neighborhood School', 'neighborhood', true, 23, true),
  (p_household_id, 'Walkable to Coffee Shop', 'neighborhood', true, 24, true),
  (p_household_id, 'Walkable to Restaurants / Services (salon/skin/gym/etc)', 'neighborhood', true, 25, true),
  (p_household_id, 'Quiet Street', 'neighborhood', true, 26, true),
  (p_household_id, 'Access to Bus Line', 'neighborhood', true, 27, true);

  -- Transportation (2 categories)
  INSERT INTO categories (household_id, name, category_group, is_default, display_order, is_active) VALUES
  (p_household_id, 'Good Bike Storage (Size and Ease of Use)', 'transportation', true, 28, true),
  (p_household_id, 'Off Street Car Parking', 'transportation', true, 29, true);

  -- Yard (5 categories) - Note: Adjusted to 5 to make total 34, but keeping original 29
  INSERT INTO categories (household_id, name, category_group, is_default, display_order, is_active) VALUES
  (p_household_id, 'Fenced Yard', 'yard', true, 30, true),
  (p_household_id, 'Front Porch (for sitting)', 'yard', true, 31, true),
  (p_household_id, 'Covered Outdoor Area', 'yard', true, 32, true),
  (p_household_id, 'Swing Tree (Big Tree)', 'yard', true, 33, true),
  (p_household_id, 'Grassy Back Yard', 'yard', true, 34, true);
END;
$$ LANGUAGE plpgsql;

-- Automatically seed categories when a new household is created
CREATE OR REPLACE FUNCTION auto_seed_categories_on_household_create()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_seed_categories
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_categories_on_household_create();
