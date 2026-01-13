# HouseRater Launch Roadmap

## Overview
This document outlines the steps required to take HouseRater from development to a live, shareable application.

**Last Updated:** January 2026

---

## Current State Assessment

### What's Working ✅
- User authentication (signup, login, logout)
- Household creation and member invitations
- Category management (view, add, delete, toggle active)
- House management (add, edit, view, delete, archive/restore)
- Rating system (per-user ratings with notes, auto-save)
- Priority/weight system (per-user category weights)
- Persistent navigation (sidebar + bottom nav)
- Responsive design (desktop + mobile)
- Dark mode support
- **NEW: Guided onboarding tour with 5-step journey**
- **NEW: Progress checklist for new users**

### What's Missing for Launch
- ~~Onboarding flow for new users~~ ✅ COMPLETE
- House comparison/scoring view
- Email delivery for invitations (currently limited)
- Error boundaries and user-friendly error pages
- Legal pages (Privacy Policy, Terms of Service)
- Production environment configuration

---

## Launch Phases

### Phase 1: Core Completion (Pre-Launch)
**Goal:** Complete essential features for a functional MVP

#### 1.1 Onboarding Module ✅ COMPLETE
- [x] Welcome modal on first dashboard visit
- [x] Household member invitation prompt
- [x] Category setup guide
- [x] Priority rating introduction (independent rating emphasis)
- [x] First house prompt (suggest current home as baseline)
- [x] Progress checklist component
- [x] "Take a Tour" restart button in sidebar
- [x] localStorage persistence (user-keyed for multi-account)

**Reference:** [ONBOARDING_IMPLEMENTATION_PLAN.md](./ONBOARDING_IMPLEMENTATION_PLAN.md)

#### 1.2 House Comparison View
- [ ] Side-by-side house comparison
- [ ] Weighted score calculation display
- [ ] Per-member score breakdown
- [ ] Household aggregate scores
- [ ] Visual score indicators (charts/bars)

#### 1.3 Error Handling
- [ ] Global error boundary component
- [ ] Custom 404 page
- [ ] Custom 500 page
- [ ] User-friendly error messages throughout
- [ ] Network error handling with retry options

---

### Phase 2: Infrastructure Setup
**Goal:** Prepare production environment

#### 2.1 Vercel Deployment
```
Steps:
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework: Next.js
   - Build Command: npm run build
   - Output Directory: .next
3. Set environment variables (see 2.3)
4. Deploy to preview URL
5. Test all functionality on preview
```

**Vercel Settings:**
| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Node.js Version | 18.x or 20.x |
| Build Command | `cd packages/web && npm run build` |
| Install Command | `npm install` |
| Root Directory | `packages/web` |

#### 2.2 Supabase Production Project
```
Steps:
1. Create new Supabase project (production)
2. Run database migrations/schema
3. Execute seed-default-categories.sql function creation
4. Configure authentication settings
5. Set up Row Level Security policies
6. Test database connectivity
```

**Supabase Auth Configuration:**
| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | http://localhost:3000 | https://yourdomain.com |
| Redirect URLs | http://localhost:3000/* | https://yourdomain.com/* |
| Email confirmations | Disabled (for ease) | Enabled |
| Email templates | Default | Customized |

#### 2.3 Environment Variables

**Required for Vercel:**
```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Server-side only (for API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# App configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Security Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser - this is intentional for Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_`
- Anon key is safe to expose - RLS policies protect data

#### 2.4 Domain Configuration
```
Steps:
1. Register domain (if not already owned)
   - Recommended: houserater.app, houserater.io, or similar
2. Add domain to Vercel project
3. Configure DNS records (Vercel provides instructions)
4. Wait for SSL certificate provisioning (automatic)
5. Update Supabase Site URL to new domain
6. Update Supabase Redirect URLs
```

**DNS Records (typical):**
| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.19.19 |
| CNAME | www | cname.vercel-dns.com |

---

### Phase 3: Email & Communications
**Goal:** Ensure reliable email delivery for invitations

#### 3.1 Email Provider Options

**Option A: Supabase Built-in (Simplest)**
- Pros: No setup required, works immediately
- Cons: Rate limited (4 emails/hour on free tier), generic templates
- Best for: Testing, very small user base

**Option B: Resend (Recommended)**
- Pros: Great developer experience, generous free tier (100 emails/day)
- Cons: Requires setup
- Cost: Free up to 3,000 emails/month

**Option C: SendGrid**
- Pros: Industry standard, extensive features
- Cons: More complex setup
- Cost: Free up to 100 emails/day

#### 3.2 Email Configuration (Resend Example)
```
Steps:
1. Create Resend account at resend.com
2. Verify your domain
3. Get API key
4. In Supabase Dashboard:
   - Go to Authentication > Email Templates
   - Go to Project Settings > Auth
   - Configure Custom SMTP:
     Host: smtp.resend.com
     Port: 465
     Username: resend
     Password: re_your_api_key
```

#### 3.3 Email Templates to Customize
- [ ] Signup confirmation
- [ ] Household invitation
- [ ] Password reset
- [ ] Email change confirmation

**Invitation Email Template:**
```html
Subject: You've been invited to join {{household_name}} on HouseRater

Hi there!

{{inviter_name}} has invited you to join their household on HouseRater
to help make house-buying decisions together.

Click below to accept the invitation:
{{confirmation_url}}

What is HouseRater?
HouseRater helps households make confident, collaborative home-buying
decisions by rating houses against personalized priorities.

Questions? Just reply to this email.
```

---

### Phase 4: Legal & Compliance
**Goal:** Protect users and the application legally

#### 4.1 Privacy Policy
**Must Include:**
- What data is collected (email, name, house ratings, preferences)
- How data is used (app functionality only)
- Data storage location (Supabase/AWS)
- Data sharing policy (none, except within household)
- User rights (access, deletion, export)
- Cookie usage (authentication only)
- Contact information

**Page Location:** `/privacy`

#### 4.2 Terms of Service
**Must Include:**
- Service description
- User responsibilities
- Acceptable use policy
- Account termination rights
- Limitation of liability
- Dispute resolution
- Modification of terms

**Page Location:** `/terms`

#### 4.3 Cookie Consent
- Required for EU users (GDPR)
- Simple banner for auth-only cookies
- Can use simple implementation since only essential cookies used

#### 4.4 Data Handling
- [ ] Implement account deletion (user can delete their data)
- [ ] Implement data export (user can download their data)
- [ ] Document data retention policy

---

### Phase 5: Testing & Quality Assurance
**Goal:** Ensure reliability before public launch

#### 5.1 Functional Testing Checklist
```
Authentication:
[ ] Sign up with new email
[ ] Email confirmation (if enabled)
[ ] Login with existing account
[ ] Password reset flow
[ ] Logout from all pages
[ ] Session persistence across browser restart

Household:
[ ] Create new household
[ ] Invite member via email
[ ] Accept invitation as new user
[ ] Accept invitation as existing user
[ ] View household members
[ ] Member permissions (owner vs member)

Categories:
[ ] View default categories
[ ] Add custom category
[ ] Delete category (default and custom)
[ ] Toggle category active/inactive
[ ] Categories persist across sessions

Priorities:
[ ] Set weights for categories
[ ] Weights auto-save
[ ] Weights persist across sessions
[ ] Different users have independent weights

Houses:
[ ] Add new house
[ ] Edit house details
[ ] Delete house
[ ] View house details
[ ] Houses visible to all household members

Ratings:
[ ] Rate house on categories
[ ] Ratings auto-save
[ ] Add notes to ratings
[ ] Edit existing ratings
[ ] Different users have independent ratings

Navigation:
[ ] Sidebar works on desktop
[ ] Bottom nav works on mobile
[ ] All nav links route correctly
[ ] Active state highlights correctly
```

#### 5.2 Cross-Browser Testing
| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | [ ] | [ ] |
| Safari | [ ] | [ ] (iOS) |
| Firefox | [ ] | [ ] |
| Edge | [ ] | - |

#### 5.3 Performance Testing
- [ ] Run Lighthouse audit (target: 90+ on all metrics)
- [ ] Test on slow 3G connection
- [ ] Verify images are optimized
- [ ] Check bundle size

#### 5.4 Security Testing
- [ ] Verify RLS policies block unauthorized access
- [ ] Test that users can't see other households' data
- [ ] Verify API routes validate authentication
- [ ] Check for exposed secrets in client bundle

---

### Phase 6: Monitoring & Analytics (Optional)
**Goal:** Understand usage and catch issues

#### 6.1 Error Tracking (Sentry)
```
Steps:
1. Create Sentry account
2. Create Next.js project in Sentry
3. Install: npm install @sentry/nextjs
4. Run setup wizard: npx @sentry/wizard@latest -i nextjs
5. Add SENTRY_DSN to environment variables
```

#### 6.2 Analytics Options
| Tool | Pros | Privacy |
|------|------|---------|
| Vercel Analytics | Built-in, simple | Privacy-friendly |
| Plausible | Privacy-first, simple | No cookies |
| PostHog | Feature-rich, self-hostable | Configurable |
| Google Analytics | Free, powerful | Privacy concerns |

**Recommendation:** Vercel Analytics or Plausible for privacy-conscious approach

#### 6.3 Uptime Monitoring
- [ ] Set up uptime check (UptimeRobot, Better Uptime, or similar)
- [ ] Configure alert notifications
- [ ] Monitor key endpoints:
  - `/` (landing page)
  - `/dashboard` (main app)
  - `/api/health` (if implemented)

---

## Launch Checklist

### Pre-Launch (1 week before)
- [ ] All Phase 1 features complete
- [ ] Production Supabase project configured
- [ ] Vercel deployment working on preview URL
- [ ] Email delivery tested and working
- [ ] All functional tests passing
- [ ] Privacy Policy page live
- [ ] Terms of Service page live

### Launch Day
- [ ] Connect custom domain
- [ ] Update Supabase URLs to production domain
- [ ] Verify SSL certificate active
- [ ] Run full functional test on production
- [ ] Monitor error logs for first hour
- [ ] Have rollback plan ready

### Post-Launch (1 week after)
- [ ] Monitor error rates
- [ ] Gather user feedback
- [ ] Address critical bugs immediately
- [ ] Plan iteration based on feedback

---

## Effort Estimates

| Phase | Effort | Priority | Status |
|-------|--------|----------|--------|
| Phase 1: Core Completion | 3-5 days | Critical | **75% Complete** |
| Phase 2: Infrastructure | 2-4 hours | Critical | Not Started |
| Phase 3: Email Setup | 1-2 hours | High | Not Started |
| Phase 4: Legal Pages | 2-4 hours | High | Not Started |
| Phase 5: Testing | 1-2 days | Critical | Not Started |
| Phase 6: Monitoring | 1-2 hours | Medium | Not Started |

**Remaining Work:**
- Phase 1.2: House Comparison View (~2-3 days)
- Phase 1.3: Error Handling (~0.5 days)
- Phases 2-6: Infrastructure & Launch (~1-2 days)

**Total Estimated Time to Launch:** 3-5 days of focused work

---

## Quick Launch Path (MVP)

If you want to share with a small group quickly:

1. **Deploy to Vercel** (30 min)
   - Use existing Supabase project
   - Skip custom domain (use `.vercel.app` URL)

2. **Basic Email** (already working)
   - Supabase built-in email works for small scale
   - Limited to ~4 invites/hour

3. **Skip for MVP**
   - Custom domain
   - Analytics
   - Legal pages (add before public launch)
   - ~~Onboarding (users can figure it out)~~ ✅ Now included!

4. **Share URL** with household members

**Time to MVP Share:** 1-2 hours

---

## Future Enhancements (Post-Launch)

### Near-term
- House comparison dashboard with scoring
- Household priority comparison view
- Photo uploads for houses
- Import house from Zillow/Redfin URL

### Medium-term
- Mobile app (React Native or PWA)
- Collaborative notes/comments on houses
- House viewing scheduler
- Notification system

### Long-term
- AI-powered house recommendations
- Market data integration
- Realtor collaboration features
- Multi-household support (for realtors)
