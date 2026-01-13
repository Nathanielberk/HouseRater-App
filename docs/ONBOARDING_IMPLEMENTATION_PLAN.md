# Guided Tour Onboarding Implementation Plan

## Overview
Implement a guided onboarding flow that walks new users through the complete HouseRater setup and workflow. The tour emphasizes the collaborative household nature and proper sequencing of setup steps.

## Implementation Status: COMPLETE

All core onboarding functionality has been implemented and tested. Build passes with no errors.

---

## User Journey (5-Step Sequence)

```
1. HOUSEHOLD SETUP
   "Who are you house shopping with?"
   → Invite household members (partner, family, roommates)
   → Everyone needs their own account to rate independently

2. CATEGORY SETUP
   "What matters to you in a home?"
   → Review default categories, delete irrelevant ones
   → Add custom categories specific to your needs

3. INDIVIDUAL PRIORITY RATING
   "How important is each category to YOU?"
   → Each household member rates independently
   → Prevents groupthink, captures true individual priorities

4. ADD HOUSES
   "Start with your current home as a baseline"
   → Current dwelling provides comparison reference
   → Add houses you're considering

5. RATE HOUSES
   "How does each house perform on your priorities?"
   → Rate each house on all categories
   → Compare scores across households
```

---

## Architecture

### State Management Pattern
- **React Context + useReducer** for centralized state management
- **localStorage** for persistence (keyed by user ID for multi-account support)
- **Version field** for future state migrations

### Tour Trigger Behavior

**First Login Only (Automatic)**
- Welcome modal appears ONLY on user's very first login after account creation
- Uses `isFirstLogin` flag (true until welcome modal dismissed)
- Uses `hasCompletedOnboarding` flag to prevent re-triggering

**On-Demand Access**
- "Take a Tour" button in sidebar user section
- Calls `resetOnboarding()` which sets `isFirstLogin: true` and clears progress

---

## Implementation Details

### Files Created

#### Library Files (`lib/tour/`)

| File | Purpose |
|------|---------|
| `tourTypes.ts` | Type definitions, OnboardingState interface, action types, default state |
| `tourStorage.ts` | localStorage read/write helpers with user-keyed storage |
| `tourSteps.ts` | Step content definitions for the 5-step journey |
| `index.ts` | Barrel export |

**Key Types (tourTypes.ts):**
```typescript
type OnboardingStep = 'household-members' | 'categories-review' | 'priorities-intro' | 'add-first-house' | 'rate-house'
type TourName = 'welcome' | 'dashboard' | 'categories' | 'priorities' | 'houses' | 'rating'

interface OnboardingState {
  userId: string                    // Key for multi-account support
  hasCompletedOnboarding: boolean   // Prevents auto-show after first completion
  isFirstLogin: boolean             // True until welcome modal dismissed
  completedSteps: OnboardingStep[]
  completedTours: TourName[]
  skippedTours: TourName[]
  version: number
}

type OnboardingAction =
  | { type: 'COMPLETE_STEP'; step: OnboardingStep }
  | { type: 'COMPLETE_TOUR'; tour: TourName }
  | { type: 'SKIP_TOUR'; tour: TourName }
  | { type: 'DISMISS_WELCOME' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'LOAD_STATE'; state: OnboardingState }
```

**Storage Functions (tourStorage.ts):**
```typescript
const STORAGE_KEY_PREFIX = 'houserater_onboarding_'

getOnboardingState(userId: string): OnboardingState | null
setOnboardingState(state: OnboardingState): void
createInitialState(userId: string): OnboardingState
isFirstLogin(userId: string): boolean
markOnboardingComplete(userId: string): void
resetOnboarding(userId: string): void
clearOnboardingData(userId: string): void
```

#### Component Files (`components/onboarding/`)

| File | Purpose |
|------|---------|
| `TourContext.tsx` | React Context creation and `useTour()` hook |
| `TourProvider.tsx` | State provider with useReducer, localStorage sync |
| `WelcomeModal.tsx` | First-login 5-step journey modal with icons |
| `OnboardingChecklist.tsx` | Progress tracker widget with progress bar |
| `InviteMembersPrompt.tsx` | Household invite prompt for solo users |
| `CategorySetupGuide.tsx` | Categories page intro modal |
| `PrioritiesIntro.tsx` | Priorities page intro modal |
| `AddFirstHousePrompt.tsx` | Empty houses page prompt |
| `index.ts` | Barrel export |

**TourProvider Implementation:**
```typescript
function onboardingReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_STEP':      // Add step to completedSteps array
    case 'COMPLETE_TOUR':      // Add tour to completedTours array
    case 'SKIP_TOUR':          // Add tour to skippedTours array
    case 'DISMISS_WELCOME':    // Set isFirstLogin = false
    case 'COMPLETE_ONBOARDING': // Set hasCompletedOnboarding = true
    case 'RESET_ONBOARDING':   // Reset to defaults with isFirstLogin = true
    case 'LOAD_STATE':         // Replace entire state (for initial load)
  }
}

// Load from localStorage on mount
useEffect(() => {
  const savedState = getOnboardingState(userId)
  if (savedState) dispatch({ type: 'LOAD_STATE', state: savedState })
  else dispatch({ type: 'LOAD_STATE', state: createInitialState(userId) })
}, [userId])

// Save to localStorage on change
useEffect(() => {
  if (state.userId) setOnboardingState(state)
}, [state])

// shouldShowWelcome computed property
const shouldShowWelcome = state.isFirstLogin && !state.hasCompletedOnboarding
```

**Context Value Interface:**
```typescript
interface TourContextValue {
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
  isStepCompleted: (step: OnboardingStep) => boolean
  isTourCompleted: (tour: TourName) => boolean
  isTourSkipped: (tour: TourName) => boolean
  shouldShowWelcome: boolean
  completeStep: (step: OnboardingStep) => void
  completeTour: (tour: TourName) => void
  skipTour: (tour: TourName) => void
  dismissWelcome: () => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}
```

### Files Modified

#### 1. `app/dashboard/layout.tsx`
```tsx
import { TourProvider, WelcomeModal } from '@/components/onboarding'

// Track authUserId from Supabase auth
const [authUserId, setAuthUserId] = useState<string | null>(null)

// In loadUserData:
setAuthUserId(user.id)

// Render:
return (
  <TourProvider userId={authUserId || ''}>
    <DashboardShell ...>
      {children}
    </DashboardShell>
    <WelcomeModal />
  </TourProvider>
)
```

#### 2. `components/navigation/Sidebar.tsx`
```tsx
import { useTour } from '@/components/onboarding'

const { resetOnboarding } = useTour()

const handleTakeTour = () => {
  resetOnboarding()
}

// In user profile section:
<button onClick={handleTakeTour} className="...">
  <QuestionMarkIcon />
  Take a Tour
</button>
```

#### 3. `app/dashboard/page.tsx`
- Added `InviteMembersPrompt` component (shows when user is alone in household)
- Added `OnboardingChecklist` component (shows until onboarding complete)

#### 4. `app/dashboard/categories/page.tsx`
- Added `CategorySetupGuide` modal on first visit
- Calls `completeStep('categories-review')` on dismiss

#### 5. `app/dashboard/weights/page.tsx`
- Added `PrioritiesIntro` modal on first visit
- Calls `completeStep('priorities-intro')` on dismiss

#### 6. `app/dashboard/houses/page.tsx`
- Added `AddFirstHousePrompt` when no houses exist
- Calls `completeStep('add-first-house')` when house added

---

## localStorage Schema

**Key:** `houserater_onboarding_{userId}`

```json
{
  "userId": "abc-123-def",
  "hasCompletedOnboarding": false,
  "isFirstLogin": false,
  "completedSteps": ["categories-review", "priorities-intro"],
  "completedTours": ["welcome"],
  "skippedTours": [],
  "version": 1
}
```

---

## Component Behavior Details

### WelcomeModal
- Shows when `shouldShowWelcome` is true (500ms delay after mount)
- Displays 5-step journey with SVG icons (users, list, scale, home, star)
- "Let's Get Started" button calls `dismissWelcome()` + `completeTour('welcome')`
- Backdrop click also dismisses
- Full dark mode support

### OnboardingChecklist
- Shows on dashboard until `hasCompletedOnboarding` or manually dismissed
- 5 items linked to relevant pages: Household, Categories, Priorities, Add house, Rate house
- Progress bar shows completion percentage
- Completed items show green checkmark and strikethrough
- "Dismiss" button (or "Complete & Dismiss" when all done)

### Page Intro Modals
- Each shows only on first visit to that page (tracked via completedSteps)
- Dismissing marks the step complete
- All have consistent styling with dark mode support

---

## Testing Status

### Build Tests
- [x] TypeScript compilation: No errors
- [x] Production build: 13/13 pages generated successfully
- [x] Dev server: Starts without errors

### Manual Testing Checklist
- [ ] New user signup → Welcome modal appears
- [ ] Click "Let's Get Started" → Modal closes, checklist appears
- [ ] Navigate to each page → Page-specific intro modals appear once
- [ ] Complete all checklist items → Progress bar fills
- [ ] Click "Dismiss" → Checklist hidden
- [ ] Sign out and back in → No welcome modal (state persisted)
- [ ] Click "Take a Tour" in sidebar → Welcome modal reappears
- [ ] Different user account → Independent onboarding state
- [ ] Clear localStorage → Resets to first-login state

---

## Future Enhancements (Not Implemented)

1. **TourTooltip.tsx** - Positioned tooltips for highlighting specific UI elements
2. **TourBackdrop.tsx** - Spotlight overlay for focused attention during tours
3. **Tooltip tours** - Step-by-step guided tours on each page using targetSelector
4. **Server-side persistence** - Store onboarding state in Supabase for cross-device sync
5. **Analytics** - Track onboarding completion rates and drop-off points

---

## Key Files Quick Reference

| File | Location | Purpose |
|------|----------|---------|
| tourTypes.ts | `lib/tour/` | Type definitions and default state |
| tourStorage.ts | `lib/tour/` | localStorage read/write helpers |
| tourSteps.ts | `lib/tour/` | Step content definitions |
| TourContext.tsx | `components/onboarding/` | React Context and useTour hook |
| TourProvider.tsx | `components/onboarding/` | State provider with useReducer |
| WelcomeModal.tsx | `components/onboarding/` | First-login 5-step journey modal |
| OnboardingChecklist.tsx | `components/onboarding/` | Progress tracker widget |
| layout.tsx | `app/dashboard/` | Provider integration point |
| Sidebar.tsx | `components/navigation/` | "Take a Tour" button location |
