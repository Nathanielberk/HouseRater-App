# HouseRater Production Deployment Plan

## Overview
Step-by-step guide to deploy HouseRater from local development to a production environment accessible via the internet.

**Target Stack:**
- **Hosting:** Vercel (Next.js optimized)
- **Database:** Supabase (PostgreSQL + Auth)
- **Domain:** Custom domain (optional for MVP)

**Last Updated:** January 2026

---

## Current Deployment Status: LIVE

### Production URLs
| Resource | URL |
|----------|-----|
| **Live App** | `https://house-rater-app.vercel.app` (or your assigned URL) |
| **Vercel Dashboard** | vercel.com/dashboard |
| **Supabase Dashboard** | supabase.com/dashboard |
| **GitHub Repo** | github.com/Nathanielberk/HouseRater-App |

### Deployment Configuration (Verified Working)
| Setting | Value |
|---------|-------|
| Framework Preset | **Next.js** |
| Root Directory | **packages/web** |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (auto-detected) |
| Node.js Version | 18.x or 20.x |
| Next.js Version | 16.1.1 |

### Environment Variables (Required in Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## Prerequisites ✅ COMPLETE

### Required Accounts
- [x] GitHub account (for repository hosting)
- [x] Vercel account (free tier)
- [x] Supabase account (development project)

### Local Setup Verified
- [x] Application builds successfully (`npm run build`)
- [x] All features working in development
- [x] Environment variables documented

---

## Phase 1: Repository Setup ✅ COMPLETE

### 1.1 GitHub Repository
**Status:** ✅ Connected and up to date

| Setting | Value |
|---------|-------|
| Repository | `https://github.com/Nathanielberk/HouseRater-App.git` |
| Branch | `master` |
| Latest Commit | `d3a83ae` - Update Next.js to 16.1.1 (security fix) |

### 1.2 Repository Structure
```
HouseRater-App/
├── packages/
│   └── web/              # Next.js application (deployed)
│       ├── app/          # App router pages
│       ├── components/   # React components (including onboarding/)
│       ├── lib/          # Utilities (supabase/, tour/, types/)
│       └── package.json
├── docs/                 # Documentation
└── README.md
```

### 1.3 Issues Fixed During Deployment
1. **Missing lib/ files** - Root `.gitignore` had Python `lib/` pattern that ignored `packages/web/lib/`
   - Fixed by commenting out `lib/` in root `.gitignore`
   - Added: `lib/tour/`, `lib/supabase/`, `lib/types/`

2. **Next.js vulnerability** - Updated from 16.0.1 to 16.1.1

---

## Phase 2: Supabase Setup ✅ USING DEVELOPMENT PROJECT

Currently using the same Supabase project for development and production.

### Supabase Project Details
- **Project:** HouseRater (development)
- **Region:** [Your region]
- **Database:** PostgreSQL with RLS enabled

### Key Tables
1. `households` - Household groups
2. `household_users` - Users within households
3. `household_invitations` - Pending invites
4. `categories` - Rating categories
5. `category_weights` - User priority weights
6. `houses` - Properties to rate
7. `house_ratings` - User ratings per house/category

### Auth Configuration Required
In Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://house-rater-app.vercel.app` |
| Redirect URLs | `https://house-rater-app.vercel.app/**` |

**Important:** Update these URLs to match your actual Vercel deployment URL.

---

## Phase 3: Vercel Deployment ✅ COMPLETE

### 3.1 Project Settings (Verified)
| Setting | Value |
|---------|-------|
| Framework Preset | **Next.js** (must be selected) |
| Root Directory | **packages/web** |
| Build Command | Default (`npm run build`) |
| Output Directory | Default (`.next`) |

### 3.2 Environment Variables (Configured)
Added in Vercel → Project → Settings → Environment Variables:

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Added |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Added |

### 3.3 Deployment Status
- [x] Vercel project created
- [x] GitHub repo connected
- [x] Root directory set to `packages/web`
- [x] Framework preset set to Next.js
- [x] Environment variables added
- [x] Build successful
- [x] App accessible via Vercel URL

---

## Phase 4: Custom Domain (Optional - Not Configured)

To add a custom domain later:
1. Go to Vercel → Project → Settings → Domains
2. Add your domain
3. Configure DNS records
4. Update Supabase URLs

---

## Phase 5: Post-Deployment Tasks

### Immediate Next Steps
- [ ] Update Supabase Site URL to production Vercel URL
- [ ] Update Supabase Redirect URLs to include production URL
- [ ] Test signup flow on production
- [ ] Test login flow on production
- [ ] Test household creation
- [ ] Verify onboarding tour works

### Smoke Test Checklist
```
[ ] Landing page loads
[ ] Can create new account
[ ] Can log in
[ ] Dashboard loads with onboarding tour
[ ] Can dismiss welcome modal
[ ] Can create household
[ ] Default categories appear
[ ] Can set priority weights
[ ] Can add house
[ ] Can rate house
[ ] Can invite household member
[ ] Dark mode works
[ ] Mobile responsive
[ ] "Take a Tour" button restarts onboarding
```

---

## Troubleshooting Reference

### Issue: 404 NOT_FOUND after deploy
**Cause:** Root directory not set correctly
**Fix:** Set Root Directory to `packages/web` in Vercel settings

### Issue: Missing public directory error
**Cause:** Framework preset not set to Next.js
**Fix:** Set Framework Preset to `Next.js` in Build & Development Settings

### Issue: MIDDLEWARE_INVOCATION_FAILED (500 error)
**Cause:** Missing Supabase environment variables
**Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel

### Issue: Module not found errors during build
**Cause:** Files ignored by `.gitignore`
**Fix:** Check root `.gitignore` for patterns that might ignore needed files (e.g., `lib/`)

### Issue: Vulnerable version of Next.js
**Fix:** Run `npm install next@latest` locally, commit, and push

---

## Git Commits During Deployment

| Commit | Description |
|--------|-------------|
| `9d644b1` | Add guided onboarding tour and launch documentation |
| `31f298b` | Update deployment plan with repository status |
| `2500bf7` | Add missing lib/ files (tour, supabase, types) |
| `d3a83ae` | Update Next.js to 16.1.1 (security fix) |

---

## Auto-Deployment Workflow

Vercel automatically deploys when you push to `master`:

```bash
# Make changes locally
npm run dev  # Test locally

# Commit and push
git add .
git commit -m "Description of changes"
git push origin master

# Vercel auto-deploys (watch dashboard for status)
```

---

## Cost Summary

### Current: Free Tier
| Service | Plan | Limits |
|---------|------|--------|
| Vercel | Hobby (Free) | Unlimited deploys, 100GB bandwidth |
| Supabase | Free | 500MB database, 50K monthly users |

**Monthly Cost:** $0

---

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Supabase client | `packages/web/lib/supabase/client.ts` |
| Supabase server | `packages/web/lib/supabase/server.ts` |
| Middleware (auth) | `packages/web/lib/supabase/middleware.ts` |
| Tour state types | `packages/web/lib/tour/tourTypes.ts` |
| Tour storage | `packages/web/lib/tour/tourStorage.ts` |
| Onboarding components | `packages/web/components/onboarding/` |
| Dashboard layout | `packages/web/app/dashboard/layout.tsx` |

---

## Summary

**HouseRater is now deployed and accessible via Vercel.**

Next steps to complete launch:
1. Update Supabase auth URLs to match production URL
2. Run smoke tests on production
3. Share URL with household members for testing
4. Gather feedback and iterate
