# Supabase Database Setup Guide

## Step 1: Access the SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your `houserater` project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

## Step 2: Create the Database Schema

1. Open the file: `docs/database-schema.sql`
2. **Copy the entire contents** of that file
3. **Paste it** into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

**What this does:**
- Creates all 6 tables (households, household_users, categories, category_weights, houses, house_ratings)
- Sets up constraints (max 8 users, max 2 owners, rating ranges 0-5)
- Creates indexes for performance
- Enables Row Level Security (RLS) to protect data
- Creates triggers for automatic `updated_at` timestamps

**Expected result:** You should see "Success. No rows returned"

## Step 3: Seed Default Categories

1. Open the file: `docs/seed-default-categories.sql`
2. **Copy the entire contents** of that file
3. **Paste it** into a new query in the Supabase SQL Editor
4. Click **"Run"**

**What this does:**
- Creates a function to insert the 34 default categories
- Sets up an automatic trigger that runs whenever a new household is created
- The 34 categories will be automatically added to any new household

**Expected result:** "Success. No rows returned"

## Step 4: Verify the Setup

Run this query to check if everything was created correctly:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('households', 'household_users', 'categories', 'category_weights', 'houses', 'house_ratings')
ORDER BY table_name;
```

**Expected result:** Should return 6 rows with all table names

## Step 5: Test with Sample Data (Optional)

To test that everything works, you can create a sample household:

```sql
-- Create a test household
INSERT INTO households (name) VALUES ('Test Family');

-- Get the household ID (copy this for next steps)
SELECT id, name FROM households WHERE name = 'Test Family';

-- Check that categories were auto-created (should return 34 rows)
SELECT category_group, COUNT(*) as count
FROM categories
WHERE household_id = 'PASTE_HOUSEHOLD_ID_HERE'
GROUP BY category_group
ORDER BY category_group;
```

**Expected result:**
- features: 10
- neighborhood: 7
- size: 10
- transportation: 2
- yard: 5
- **Total: 34 categories**

## Database Schema Summary

### Tables Created:

1. **households** - Main household/family groups
2. **household_users** - 2-8 users per household (max 2 owners)
3. **categories** - 34 default + custom categories per household
4. **category_weights** - Each user's importance ratings (0-5)
5. **houses** - Houses with nickname, full address, price, location
6. **house_ratings** - Each user's ratings per house/category with nickname

### Security Features:

- ✅ **Row Level Security (RLS)** - Users can only see their household's data
- ✅ **User Limits** - Max 8 users, max 2 owners per household
- ✅ **Data Validation** - Ratings must be 0-5, roles must be owner/member
- ✅ **Cascade Deletes** - Deleting a household deletes all related data
- ✅ **Unique Constraints** - No duplicate emails, categories, or ratings

### Automatic Features:

- ✅ **Auto-generate UUIDs** for all IDs
- ✅ **Auto-update timestamps** when records change
- ✅ **Auto-seed categories** when household is created
- ✅ **Auto-enforce limits** via database triggers

## Next Steps

After running these SQL scripts, your database is ready! You can now:

1. Build the authentication flow
2. Create the category management UI
3. Build the house rating interface
4. Implement the scoring/comparison features

## Troubleshooting

### Error: "permission denied for schema public"
- Make sure you're logged in to your Supabase project
- Check that you're in the correct project

### Error: "relation already exists"
- The table was already created
- Either drop the tables first or skip to the next step

### Categories not auto-creating
- Make sure you ran BOTH SQL scripts
- The trigger in `seed-default-categories.sql` must be created

### Need to start fresh?
Run this to drop all tables and start over:

```sql
DROP TABLE IF EXISTS house_ratings CASCADE;
DROP TABLE IF EXISTS houses CASCADE;
DROP TABLE IF EXISTS category_weights CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS household_users CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP FUNCTION IF EXISTS seed_default_categories CASCADE;
DROP FUNCTION IF EXISTS auto_seed_categories_on_household_create CASCADE;
DROP FUNCTION IF EXISTS get_user_household_id CASCADE;
DROP FUNCTION IF EXISTS check_household_user_limit CASCADE;
DROP FUNCTION IF EXISTS check_household_owner_limit CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Then re-run both SQL scripts from Step 2 and Step 3.
