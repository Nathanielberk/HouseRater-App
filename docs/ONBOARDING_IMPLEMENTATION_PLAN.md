# Guided Tour Onboarding Implementation Plan

## Overview
Implement a guided onboarding flow that walks new users through the complete HouseRater setup and workflow. The tour emphasizes the collaborative household nature and proper sequencing of setup steps.

## User Journey (Correct Sequence)

```
1. HOUSEHOLD SETUP
   "Who are you house shopping with?"
   → Invite household members (partner, family, roommates)
   → Everyone needs their own account to rate independently

2. CATEGORY SETUP
   "What matters to you in a home?"
   → Review default categories, delete irrelevant ones
   → Add custom categories specific to your needs
   → Categories should be specific, categorized, non-redundant
   → Can always update later

3. INDIVIDUAL PRIORITY RATING
   "How important is each category to YOU?"
   → Each household member rates independently
   → Prevents groupthink, captures true individual priorities
   → Can review together and adjust after everyone completes

4. ADD HOUSES
   "Start with your current home as a baseline"
   → Current dwelling provides comparison reference
   → Add houses you're considering

5. RATE HOUSES
   "How does each house perform on your priorities?"
   → Rate each house on all categories
   → Compare scores across houses and household members
```

## Current State
- Household setup exists at `/auth/household-setup` but only captures name
- No prompting to invite members during onboarding
- No guided category review/customization
- No explanation of independent rating importance
- No suggestion to add current home first

## Implementation Approach

### Custom Implementation (No Third-Party Library)
- Tailwind-native styling matches existing design
- Minimal bundle impact (~400 lines)
- Guaranteed React 19 compatibility
- Full control over behavior and flow

### State Persistence: localStorage
- Track which onboarding steps completed
- Track which tours shown
- Version field for migration

## Files to Create

### 1. `lib/tour/tourTypes.ts`
```typescript
type OnboardingStep =
  | 'household-members'  // Invite household members
  | 'categories-review'  // Review/customize categories
  | 'priorities-intro'   // Explain independent rating
  | 'add-first-house'    // Suggest current dwelling
  | 'rate-house'         // Rating walkthrough

type TourName = 'welcome' | 'dashboard' | 'categories' | 'priorities' | 'houses' | 'rating'

interface TourStep {
  id: string
  targetSelector?: string  // For tooltip positioning
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  type?: 'modal' | 'tooltip' | 'banner'
  action?: { label: string; href?: string; onClick?: string }
}

interface OnboardingState {
  completedSteps: OnboardingStep[]
  completedTours: TourName[]
  skippedTours: TourName[]
  version: number
}
```

### 2. `lib/tour/tourStorage.ts`
localStorage helpers for persisting onboarding state

### 3. `lib/tour/tourSteps.ts`
Tour step definitions (see detailed steps below)

### 4. `components/onboarding/TourContext.tsx`
React Context for tour state management

### 5. `components/onboarding/TourProvider.tsx`
Provider with useReducer for state management

### 6. `components/onboarding/WelcomeModal.tsx`
Initial welcome explaining the journey:
- "Welcome to HouseRater!"
- Explains the 5-step process
- Emphasizes collaborative nature
- "Let's get started" button

### 7. `components/onboarding/OnboardingChecklist.tsx`
Persistent checklist showing progress:
- [ ] Set up your household
- [ ] Customize categories
- [ ] Set your priorities
- [ ] Add your first house
- [ ] Rate a house
Dismissible after completion

### 8. `components/onboarding/TourTooltip.tsx`
Positioned tooltip for highlighting UI elements

### 9. `components/onboarding/TourBackdrop.tsx`
Spotlight overlay for focused attention

### 10. `components/onboarding/InviteMembersPrompt.tsx`
Prompt shown on dashboard for new households:
- "Who are you house shopping with?"
- Quick invite form
- "I'm shopping alone" option

### 11. `components/onboarding/CategorySetupGuide.tsx`
Guide shown on categories page first visit:
- Explains purpose of categories
- Tips for good categories (specific, non-redundant)
- "Review defaults and customize" CTA

### 12. `components/onboarding/PrioritiesIntro.tsx`
Modal before priorities page:
- Explains importance of independent rating
- "Rate based on YOUR preferences"
- "You can discuss and adjust after everyone rates"

### 13. `components/onboarding/AddFirstHousePrompt.tsx`
Prompt on houses page when empty:
- "Start with your current home"
- Explains baseline comparison benefit
- "Add Current Home" CTA

## Detailed Tour Steps

### Welcome Modal (First Dashboard Visit)
```
┌─────────────────────────────────────────────────────────────┐
│                   Welcome to HouseRater!                     │
│                                                              │
│  Make confident home-buying decisions together.              │
│                                                              │
│  Here's how it works:                                       │
│                                                              │
│  👥 1. Set up your household                                │
│     Invite everyone who'll help decide                      │
│                                                              │
│  📋 2. Customize your categories                            │
│     What features matter for YOUR ideal home?               │
│                                                              │
│  ⚖️ 3. Rate your priorities (individually!)                 │
│     Each person rates what matters most to THEM             │
│                                                              │
│  🏠 4. Add houses to compare                                │
│     Start with your current home as a baseline              │
│                                                              │
│  ⭐ 5. Rate each house                                      │
│     See how houses score for your whole household           │
│                                                              │
│                    [Let's Get Started]                       │
└─────────────────────────────────────────────────────────────┘
```

### Household Members Prompt (Dashboard, new household)
```
┌─────────────────────────────────────────────────────────────┐
│  👥 Who are you house shopping with?                        │
│                                                              │
│  Invite your partner, family members, or roommates.         │
│  Everyone gets their own account to rate independently.     │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │ Email address                           │ [Send Invite]  │
│  └─────────────────────────────────────────┘                │
│                                                              │
│  [I'm shopping alone]           [I'll do this later]        │
└─────────────────────────────────────────────────────────────┘
```

### Categories Guide (First visit to /categories)
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Customize Your Categories                                │
│                                                              │
│  Categories are the features you'll rate each house on.     │
│                                                              │
│  We've added common categories to get you started.          │
│  Review them and:                                           │
│                                                              │
│  ✓ Delete any that don't apply to your search              │
│  ✓ Add custom categories specific to YOUR needs            │
│                                                              │
│  Tips for good categories:                                  │
│  • Be specific ("Walk to grocery store" vs "Good location") │
│  • Avoid redundancy (don't duplicate similar items)         │
│  • Think about dealbreakers AND nice-to-haves              │
│                                                              │
│  You can always add or remove categories later.             │
│                                                              │
│                    [Review Categories]                       │
└─────────────────────────────────────────────────────────────┘
```

### Priorities Introduction (First visit to /weights)
```
┌─────────────────────────────────────────────────────────────┐
│  ⚖️ Set Your Priorities                                     │
│                                                              │
│  Rate how important each category is to YOU personally.     │
│                                                              │
│  ⚠️ Important: Do this independently!                       │
│                                                              │
│  Don't discuss with your household members yet.             │
│  This captures everyone's TRUE priorities before            │
│  any group influence.                                       │
│                                                              │
│  After everyone completes their ratings:                    │
│  • Review priorities together                               │
│  • Discuss any differences                                  │
│  • Adjust if minds change                                   │
│                                                              │
│                    [Set My Priorities]                       │
└─────────────────────────────────────────────────────────────┘
```

### Add First House Prompt (Empty houses page)
```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Add Your First House                                    │
│                                                              │
│  Pro tip: Start with your CURRENT home!                     │
│                                                              │
│  Rating where you live now gives you a baseline             │
│  to compare potential new homes against.                    │
│                                                              │
│  You'll see how candidates stack up against                 │
│  what you already know.                                     │
│                                                              │
│  [Add Current Home]        [Add a Different House]          │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

### 1. `app/dashboard/layout.tsx`
- Wrap with TourProvider
- Include OnboardingChecklist component

### 2. `app/dashboard/page.tsx`
- Add WelcomeModal trigger for new users
- Add InviteMembersPrompt for single-member households
- Add data-tour attributes

### 3. `app/dashboard/categories/page.tsx`
- Add CategorySetupGuide for first visit
- Add data-tour attributes

### 4. `app/dashboard/weights/page.tsx`
- Add PrioritiesIntro modal for first visit
- Add data-tour attributes

### 5. `app/dashboard/houses/page.tsx`
- Add AddFirstHousePrompt when no houses
- Add data-tour attributes

### 6. `app/dashboard/houses/[id]/rate/page.tsx`
- Add rating tour for first house rated
- Add data-tour attributes

### 7. `app/dashboard/members/page.tsx`
- Enhance invite UI
- Add tips about independent rating

## Onboarding Checklist Component

Shown in sidebar/dashboard until all steps complete:

```
┌─────────────────────────────┐
│  Getting Started            │
│                             │
│  ✓ Create household         │
│  ○ Invite members           │
│  ○ Customize categories     │
│  ○ Set your priorities      │
│  ○ Add first house          │
│  ○ Rate a house             │
│                             │
│  [Dismiss]                  │
└─────────────────────────────┘
```

## Implementation Steps

### Phase 1: Foundation
1. Create `lib/tour/tourTypes.ts`
2. Create `lib/tour/tourStorage.ts`
3. Create `lib/tour/tourSteps.ts`
4. Create `components/onboarding/TourContext.tsx`
5. Create `components/onboarding/TourProvider.tsx`

### Phase 2: Core Modals
6. Create `components/onboarding/WelcomeModal.tsx`
7. Create `components/onboarding/InviteMembersPrompt.tsx`
8. Create `components/onboarding/CategorySetupGuide.tsx`
9. Create `components/onboarding/PrioritiesIntro.tsx`
10. Create `components/onboarding/AddFirstHousePrompt.tsx`

### Phase 3: Progress Tracking
11. Create `components/onboarding/OnboardingChecklist.tsx`
12. Create `components/onboarding/TourTooltip.tsx`
13. Create `components/onboarding/TourBackdrop.tsx`

### Phase 4: Integration
14. Modify `app/dashboard/layout.tsx` - add provider
15. Modify `app/dashboard/page.tsx` - welcome + invite prompts
16. Modify `app/dashboard/categories/page.tsx` - category guide
17. Modify `app/dashboard/weights/page.tsx` - priorities intro
18. Modify `app/dashboard/houses/page.tsx` - first house prompt
19. Modify `app/dashboard/houses/[id]/rate/page.tsx` - rating tour

### Phase 5: Polish
20. Test complete flow with new account
21. Mobile responsive testing
22. Accessibility (keyboard nav, screen readers)
23. Edge cases (skip flows, returning users)

## Key Messaging

### Household Emphasis
- "House shopping is a team decision"
- "Everyone's priorities matter"
- "Rate independently, then discuss together"

### Category Guidance
- "Be specific - 'walking distance to coffee shop' beats 'good location'"
- "Delete what doesn't matter to YOUR search"
- "Add anything unique to your needs"

### Independent Rating
- "This captures YOUR true priorities"
- "No peeking at others' ratings yet!"
- "Discuss after everyone completes"

### Current Home as Baseline
- "Your current home is the baseline"
- "See how new houses compare to what you know"
- "Makes ratings more meaningful"

## Verification

1. **New user complete flow**: Signup → all onboarding steps
2. **Multi-member flow**: Invite → member joins → both rate
3. **Skip paths**: Each prompt has dismiss option
4. **Persistence**: Refresh doesn't reset progress
5. **Checklist completion**: All items track correctly
6. **Mobile**: All modals work on small screens
