# HouseRater Production Deployment Plan

## Overview
Step-by-step guide to deploy HouseRater from local development to a production environment accessible via the internet.

**Target Stack:**
- **Hosting:** Vercel (Next.js optimized)
- **Database:** Supabase (PostgreSQL + Auth)
- **Domain:** Custom domain (optional for MVP)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for repository hosting)
- [ ] Vercel account (free tier sufficient)
- [ ] Supabase account (already have development project)

### Local Setup Verified
- [ ] Application builds successfully (`npm run build`)
- [ ] All features working in development
- [ ] Environment variables documented

---

## Phase 1: Repository Setup

### 1.1 Push to GitHub (if not already)
```bash
# From packages/web directory
git init
git add .
git commit -m "Initial commit: HouseRater web application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/houserater.git
git push -u origin main
```

### 1.2 Repository Structure
```
houserater/
├── packages/
│   └── web/              # Next.js application (deploy this)
│       ├── app/          # App router pages
│       ├── components/   # React components
│       ├── lib/          # Utilities and helpers
│       └── package.json
├── docs/                 # Documentation
└── README.md
```

---

## Phase 2: Supabase Production Setup

### 2.1 Option A: Use Existing Project (Fastest)
If your development Supabase project is suitable for production:
1. Keep using the same project
2. Skip to Phase 3
3. Consider creating separate production project later

### 2.2 Option B: Create Production Project (Recommended)
**Why separate projects?**
- Isolate production data from development testing
- Different auth settings (email confirmation enabled)
- Independent scaling and backups

**Steps:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Configure:
   - **Name:** houserater-production
   - **Database Password:** Generate strong password, save securely
   - **Region:** Choose closest to your users
   - **Plan:** Free tier works for launch

### 2.3 Database Schema Migration

Export schema from development:
```sql
-- Run in development Supabase SQL Editor
-- Or use pg_dump if you have direct access
```

**Required Tables:**
1. `households` - Household groups
2. `household_users` - Users within households
3. `household_invitations` - Pending invites
4. `categories` - Rating categories
5. `category_weights` - User priority weights
6. `houses` - Properties to rate
7. `house_ratings` - User ratings per house/category

**Schema Creation Script:**
```sql
-- Run this in production Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household users table
CREATE TABLE IF NOT EXISTS household_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, auth_user_id)
);

-- Household invitations table
CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES household_users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_group TEXT DEFAULT 'Other',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category weights table
CREATE TABLE IF NOT EXISTS category_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_user_id UUID REFERENCES household_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  weight INTEGER CHECK (weight >= 0 AND weight <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_user_id, category_id)
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price DECIMAL(12, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  lot_size_sqft INTEGER,
  year_built INTEGER,
  property_type TEXT,
  listing_url TEXT,
  notes TEXT,
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- House ratings table
CREATE TABLE IF NOT EXISTS house_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_user_id UUID REFERENCES household_users(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_user_id, house_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_household_users_auth_user ON household_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_household_users_household ON household_users(household_id);
CREATE INDEX IF NOT EXISTS idx_categories_household ON categories(household_id);
CREATE INDEX IF NOT EXISTS idx_houses_household ON houses(household_id);
CREATE INDEX IF NOT EXISTS idx_house_ratings_house ON house_ratings(house_id);
CREATE INDEX IF NOT EXISTS idx_house_ratings_user ON house_ratings(household_user_id);
```

### 2.4 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_ratings ENABLE ROW LEVEL SECURITY;

-- Households: Users can only see households they belong to
CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create households" ON households
  FOR INSERT WITH CHECK (true);

-- Household Users: Users can see members of their household
CREATE POLICY "Users can view household members" ON household_users
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert themselves" ON household_users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Categories: Users can manage categories in their household
CREATE POLICY "Users can view household categories" ON categories
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage household categories" ON categories
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

-- Houses: Users can manage houses in their household
CREATE POLICY "Users can view household houses" ON houses
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can manage household houses" ON houses
  FOR ALL USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
  );

-- Category Weights: Users can manage their own weights
CREATE POLICY "Users can view weights in household" ON category_weights
  FOR SELECT USING (
    household_user_id IN (
      SELECT id FROM household_users WHERE household_id IN (
        SELECT household_id FROM household_users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own weights" ON category_weights
  FOR ALL USING (
    household_user_id IN (SELECT id FROM household_users WHERE auth_user_id = auth.uid())
  );

-- House Ratings: Users can view all ratings, manage their own
CREATE POLICY "Users can view household ratings" ON house_ratings
  FOR SELECT USING (
    house_id IN (
      SELECT id FROM houses WHERE household_id IN (
        SELECT household_id FROM household_users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own ratings" ON house_ratings
  FOR ALL USING (
    household_user_id IN (SELECT id FROM household_users WHERE auth_user_id = auth.uid())
  );

-- Invitations: Users can view/manage invitations for their household
CREATE POLICY "Users can view household invitations" ON household_invitations
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_users WHERE auth_user_id = auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Owners can create invitations" ON household_invitations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_users
      WHERE auth_user_id = auth.uid() AND role = 'owner'
    )
  );
```

### 2.5 Default Categories Function

```sql
-- Function to seed default categories for new households
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (household_id, name, description, category_group, is_default, is_active)
  VALUES
    -- Location
    (p_household_id, 'Commute Time', 'Time to get to work/school', 'Location', true, true),
    (p_household_id, 'Neighborhood Safety', 'Crime rates and overall safety', 'Location', true, true),
    (p_household_id, 'School District', 'Quality of local schools', 'Location', true, true),
    (p_household_id, 'Walkability', 'Access to shops, restaurants, parks on foot', 'Location', true, true),

    -- Property
    (p_household_id, 'Kitchen', 'Size, layout, appliances, storage', 'Property', true, true),
    (p_household_id, 'Bathrooms', 'Number, size, condition', 'Property', true, true),
    (p_household_id, 'Bedrooms', 'Number and size of bedrooms', 'Property', true, true),
    (p_household_id, 'Storage Space', 'Closets, garage, basement, attic', 'Property', true, true),
    (p_household_id, 'Outdoor Space', 'Yard, patio, deck, balcony', 'Property', true, true),
    (p_household_id, 'Natural Light', 'Windows, brightness, sun exposure', 'Property', true, true),
    (p_household_id, 'Overall Condition', 'Age, maintenance, updates needed', 'Property', true, true),

    -- Financial
    (p_household_id, 'Purchase Price', 'Within budget and fair market value', 'Financial', true, true),
    (p_household_id, 'Property Taxes', 'Annual tax burden', 'Financial', true, true),
    (p_household_id, 'HOA/Fees', 'Monthly association fees if applicable', 'Financial', true, true),
    (p_household_id, 'Resale Value', 'Potential for appreciation', 'Financial', true, true);
END;
$$ LANGUAGE plpgsql;
```

### 2.6 Supabase Auth Configuration

In Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-app.vercel.app` (update after deploy) |
| Redirect URLs | `https://your-app.vercel.app/**` |

In Supabase Dashboard → Authentication → Email Templates:
- Customize confirmation email with HouseRater branding
- Customize password reset email
- Customize invitation email

---

## Phase 3: Vercel Deployment

### 3.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure project settings:

**Build & Development Settings:**
| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `packages/web` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

### 3.2 Environment Variables

Add these in Vercel → Project → Settings → Environment Variables:

```env
# Supabase Connection (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (for API routes if needed)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URL (update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Google Maps API (Optional - for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

**Where to find Supabase keys:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Note your deployment URL: `https://your-app.vercel.app`

### 3.4 Update Supabase URLs

After deployment, update Supabase with your Vercel URL:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Update Site URL: `https://your-app.vercel.app`
3. Update Redirect URLs: `https://your-app.vercel.app/**`

---

## Phase 4: Custom Domain (Optional)

### 4.1 Domain Options
- **houserater.app** - Professional, memorable
- **houserater.io** - Tech-focused
- **your-name-houserater.com** - Personal branding

### 4.2 Add Domain to Vercel

1. Go to Vercel → Project → Settings → Domains
2. Add your domain
3. Configure DNS as instructed:

**Typical DNS Records:**
| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.19.19 |
| CNAME | www | cname.vercel-dns.com |

4. Wait for DNS propagation (up to 48 hours, usually minutes)
5. SSL certificate auto-provisions

### 4.3 Update URLs Again

After domain is active:
1. Update Supabase Site URL to custom domain
2. Update Supabase Redirect URLs
3. Update `NEXT_PUBLIC_APP_URL` in Vercel

---

## Phase 5: Post-Deployment Verification

### 5.1 Smoke Test Checklist

```
[ ] Landing page loads
[ ] Can create new account
[ ] Email confirmation works (if enabled)
[ ] Can log in
[ ] Dashboard loads
[ ] Can create household
[ ] Default categories appear
[ ] Can add house
[ ] Can rate house
[ ] Can invite household member
[ ] Invitation email sends
[ ] Invitee can join household
[ ] Dark mode works
[ ] Mobile responsive
```

### 5.2 Common Issues & Fixes

**Issue: "Invalid API key" or auth errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check for typos or extra whitespace
- Redeploy after fixing

**Issue: "User not found" after signup**
- Check RLS policies are applied
- Verify `household_users` insert policy

**Issue: Redirect loop after login**
- Verify Supabase Site URL matches your domain
- Check Redirect URLs include your domain

**Issue: Styles broken**
- Clear Vercel cache: Settings → Functions → Purge Cache
- Redeploy

---

## Phase 6: Ongoing Maintenance

### 6.1 Monitoring

**Vercel Dashboard:**
- View deployment logs
- Check function execution times
- Monitor error rates

**Supabase Dashboard:**
- Database usage and limits
- Auth user count
- API requests

### 6.2 Updating the App

```bash
# Make changes locally
# Test with npm run dev
# Commit and push

git add .
git commit -m "Feature: description"
git push origin main

# Vercel auto-deploys on push to main
```

### 6.3 Database Backups

Supabase provides automatic daily backups on paid plans. For free tier:
- Manual export via Dashboard → Database → Backups
- Or use pg_dump with connection string

---

## Quick Reference

### Key URLs
| Resource | URL |
|----------|-----|
| Vercel Dashboard | vercel.com/dashboard |
| Supabase Dashboard | supabase.com/dashboard |
| Your App | https://your-app.vercel.app |
| Deployment Logs | Vercel → Project → Deployments |

### Environment Variables Summary
| Variable | Where Used | Security |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Public OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Public OK |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | KEEP SECRET |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Public OK |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Public (restricted) |

### Support Resources
- Vercel Docs: vercel.com/docs
- Supabase Docs: supabase.com/docs
- Next.js Docs: nextjs.org/docs

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code committed and pushed to GitHub
- [ ] `npm run build` succeeds locally
- [ ] All environment variables documented
- [ ] Supabase schema ready (tables, RLS, functions)

### Deployment
- [ ] Vercel project created
- [ ] GitHub repo connected
- [ ] Root directory set to `packages/web`
- [ ] Environment variables added
- [ ] First deployment successful

### Post-Deployment
- [ ] Supabase URLs updated with Vercel domain
- [ ] Smoke tests passed
- [ ] Invite flow tested end-to-end
- [ ] Custom domain configured (optional)

### Go Live
- [ ] Share URL with household members
- [ ] Monitor for errors
- [ ] Gather feedback
- [ ] Iterate!

---

## Cost Summary

### Free Tier Limits

**Vercel (Hobby):**
- Unlimited deployments
- 100GB bandwidth/month
- Serverless functions included

**Supabase (Free):**
- 500MB database
- 50,000 monthly active users
- 2GB file storage
- 2 million Edge Function invocations

**Total Monthly Cost:** $0 (until you exceed free tiers)

### When to Upgrade

Consider paid plans when:
- Database exceeds 500MB
- Need custom domain email (Supabase Pro)
- Want daily backups (Supabase Pro)
- High traffic (Vercel Pro)

Typical costs:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
