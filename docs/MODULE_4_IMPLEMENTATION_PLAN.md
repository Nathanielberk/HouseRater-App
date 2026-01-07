# Module 4: House Rating - Comprehensive Implementation Plan

## Status: Ready to Implement ✅

**Prerequisites Complete:**
- ✅ Module 1: Authentication
- ✅ Module 2: Categories (34 default + custom)
- ✅ Module 3: Category Weighting
- ✅ Module 5: House Management

## Overview

Module 4 enables household members to rate individual houses across all active categories. Each member rates each house independently on a 0-5 scale. These ratings, combined with weights from Module 3, will calculate final house scores in Module 6.

## Key Concepts

### Rating vs Weight vs Score

**Critical Distinction:**

```
Example: "Number of Bedrooms" category

WEIGHT (Module 3 - set once, applies to all houses):
- Jane: "Bedrooms are very important to me" → Weight: 5
- John: "Bedrooms are somewhat important" → Weight: 3
- Household Average Weight: (5 + 3) / 2 = 4.0

RATING (Module 4 - THIS MODULE - set per house):
- House A has 4 bedrooms
- Jane rates House A's bedrooms: 4/5 (good, but not perfect)
- John rates House A's bedrooms: 5/5 (perfect for him)
- Household Average Rating: (4 + 5) / 2 = 4.5

SCORE (Module 6 - future):
- House A's bedroom score = Weight × Rating = 4.0 × 4.5 = 18.0 points
```

**Key Difference:**
- **Weight**: "How important is this category to me?" (set once)
- **Rating**: "How well does THIS house perform in this category?" (per house)

## Database Schema

### Table: `house_ratings`

**Already exists** - no migration needed! ✅

```sql
CREATE TABLE house_ratings (
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

CREATE INDEX idx_house_ratings_user ON house_ratings(household_user_id);
CREATE INDEX idx_house_ratings_house ON house_ratings(house_id);
```

**Key Points:**
- One rating per user per house per category
- Rating scale: 0-5 (integer)
- Notes are optional
- UNIQUE constraint prevents duplicate ratings

## Page Structure: `/dashboard/houses/[houseId]/rate`

### Layout Design

```
┌─────────────────────────────────────────────────────────┐
│ HouseRater                    Back to House Details     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Rate: 402 N 44th St                                     │
│ Seattle, WA 98103                                       │
│ $750,000 | 3 bed, 2.5 bath | 1,850 sqft               │
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Progress     │ │ Rated        │ │ Avg Rating   │    │
│ │ 25/34        │ │ 25 categories│ │ 3.8 / 5.0   │    │
│ │ 74%          │ │              │ │              │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│ Features (10 categories)              Progress: 8/10 ✅ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Number of Bedrooms                                  │ │
│ │ Your weight: 5 (Absolutely necessary!)             │ │
│ │                                                     │ │
│ │ How does this house rate?                          │ │
│ │ ○━━━━━━━●━━━━━━━●━━━━━━━○                        │ │
│ │ 0      1      2      3      4      5               │ │
│ │ Poor         Average        Excellent              │ │
│ │                                                     │ │
│ │ Current rating: 4 - Very Good                      │ │
│ │                                                     │ │
│ │ 📝 Add notes (optional) ▼                          │ │
│ │ [This house has 4 bedrooms which is great...]      │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Number of Bathrooms                                │ │
│ │ Your weight: 3 (This would be nice)                │ │
│ │                                                     │ │
│ │ ○━━━━━━━━━━━━━━━━━━━━━━━━━○                      │ │
│ │ 0      1      2      3      4      5               │ │
│ │                                                     │ │
│ │ Not rated yet                                       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Size (10 categories)                  Progress: 0/10 ⏸️ │
│ [Click to expand...]                                    │
│                                                          │
│ Neighborhood (6 categories)           Progress: 6/6 ✅  │
│ [Collapsed - all complete...]                           │
└─────────────────────────────────────────────────────────┘
```

### Component Breakdown

```
RateHousePage (Client Component)
├── HouseContextBar
│   ├── House address + location
│   ├── Price + basic stats
│   └── Back button
│
├── RatingStats
│   ├── Progress (X/Y categories rated)
│   ├── Completion percentage
│   └── Average rating
│
├── CategoryGroupSection[] (for each group)
│   ├── GroupHeader
│   │   ├── Group name
│   │   ├── Progress indicator (X/Y)
│   │   └── Expand/collapse button
│   │
│   └── CategoryRatingCard[]
│       ├── Category name
│       ├── User's weight display
│       ├── Weight label reminder
│       ├── Rating slider (0-5)
│       ├── Rating label ("Very Good", etc.)
│       ├── Notes toggle button
│       └── Notes textarea (expandable)
│
└── HelpBox
    └── Tips and explanation
```

## Implementation Steps

### Step 1: Create Page Structure ✅

**File:** `packages/web/app/dashboard/houses/[houseId]/rate/page.tsx`

**Tasks:**
1. Create client component
2. Set up auth check and redirect
3. Fetch house details
4. Display house context bar with basic info
5. Add loading state
6. Add error handling

**Expected Time:** 30 minutes

### Step 2: Load Categories and Ratings ✅

**Tasks:**
1. Fetch all active categories for household
2. Fetch user's category weights
3. Fetch existing house ratings for current user
4. Merge data into single array
5. Group categories by `category_group`
6. Calculate initial statistics

**Data Structure:**
```typescript
interface CategoryWithRating {
  id: string
  name: string
  description: string | null
  category_group: string
  weight: number | null        // From category_weights table
  rating: number | null        // From house_ratings table
  notes: string | null         // From house_ratings table
  rating_id: string | null     // house_ratings.id for updates
}
```

**Expected Time:** 45 minutes

### Step 3: Build Rating Slider Component ✅

**Component:** `CategoryRatingSlider`

**Features:**
- 0-5 scale slider
- Visual feedback (gradient from gray → green)
- Current value display
- Rating label ("Poor" → "Excellent")
- Keyboard accessible
- Touch-friendly on mobile

**Color Gradient:**
```typescript
const getRatingColor = (rating: number | null): string => {
  if (rating === null) return 'bg-gray-300'

  const colors = [
    'bg-red-500',      // 0 - Poor
    'bg-orange-500',   // 1 - Below Average
    'bg-yellow-500',   // 2 - Average
    'bg-lime-500',     // 3 - Good
    'bg-green-500',    // 4 - Very Good
    'bg-emerald-500'   // 5 - Excellent
  ]

  return colors[rating] || 'bg-gray-300'
}
```

**Rating Labels:**
```typescript
const getRatingLabel = (rating: number | null): string => {
  if (rating === null) return 'Not rated yet'

  const labels = [
    'Nope, and it never will be',           // 0
    'No, but we could make it ours',  // 1
    'Not exactly, but this is ok',        // 2
    'Yes, it is there',           // 3
    'Very Good',      // 4
    'Better than we dreamed!'       // 5
  ]

  return labels[rating] || 'Does this house have this?'
}
```

**Expected Time:** 1 hour

### Step 4: Implement Auto-Save Logic ✅

**Features:**
- Optimistic updates (instant UI change)
- Debounced save (500ms for ratings, 1000ms for notes)
- Upsert logic (insert or update)
- Error handling with rollback
- Save indicator ("Saving..." toast)

**Code Pattern:**
```typescript
const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

const handleRatingChange = (categoryId: string, newRating: number) => {
  // 1. Optimistic update
  setCategories(prev => prev.map(cat =>
    cat.id === categoryId ? { ...cat, rating: newRating } : cat
  ))

  // 2. Clear existing timeout
  if (saveTimeout) clearTimeout(saveTimeout)

  // 3. Set new debounced save
  const timeout = setTimeout(() => {
    saveRating(categoryId, newRating)
  }, 500)
  setSaveTimeout(timeout)
}

const saveRating = async (categoryId: string, rating: number) => {
  const { error } = await supabase
    .from('house_ratings')
    .upsert({
      household_user_id: currentUser.id,
      house_id: houseId,
      category_id: categoryId,
      rating: rating,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'household_user_id,house_id,category_id'
    })

  if (error) {
    console.error('Failed to save rating:', error)
    // Revert optimistic update
    loadRatings()
  }
}
```

**Expected Time:** 1 hour

### Step 5: Add Notes Functionality ✅

**Features:**
- Expandable textarea per category
- "Add notes..." button when collapsed
- Auto-save with debouncing (1000ms)
- Character limit: 500 chars
- Character counter
- Expand/collapse animation

**UI Pattern:**
```typescript
const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

const toggleNotes = (categoryId: string) => {
  setExpandedNotes(prev => {
    const next = new Set(prev)
    if (next.has(categoryId)) {
      next.delete(categoryId)
    } else {
      next.add(categoryId)
    }
    return next
  })
}
```

**Expected Time:** 1 hour

### Step 6: Implement Progress Tracking ✅

**Metrics to Calculate:**
1. Total categories
2. Rated categories
3. Completion percentage
4. Average rating (only rated categories)
5. Per-group progress

**Code:**
```typescript
const calculateStats = () => {
  const total = categories.length
  const rated = categories.filter(cat => cat.rating !== null).length
  const ratedCategories = categories.filter(cat => cat.rating !== null)

  const avgRating = ratedCategories.length > 0
    ? ratedCategories.reduce((sum, cat) => sum + (cat.rating || 0), 0) / ratedCategories.length
    : 0

  const percentage = total > 0 ? Math.round((rated / total) * 100) : 0

  return { rated, total, avgRating, percentage }
}

const calculateGroupStats = (groupName: string) => {
  const groupCategories = categories.filter(cat => cat.category_group === groupName)
  const total = groupCategories.length
  const rated = groupCategories.filter(cat => cat.rating !== null).length

  return { rated, total, percentage: Math.round((rated / total) * 100) }
}
```

**Expected Time:** 30 minutes

### Step 7: Add Group Collapse/Expand ✅

**Features:**
- Collapsible category groups
- Auto-expand first incomplete group
- Auto-collapse completed groups
- Smooth animations
- Remember state in local storage (optional)

**Logic:**
```typescript
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

useEffect(() => {
  // Auto-expand first incomplete group
  const groups = Array.from(new Set(categories.map(c => c.category_group)))

  for (const group of groups) {
    const groupCats = categories.filter(c => c.category_group === group)
    const allRated = groupCats.every(c => c.rating !== null)

    if (!allRated) {
      setExpandedGroups(new Set([group]))
      break
    }
  }
}, [categories])
```

**Expected Time:** 45 minutes

### Step 8: Display Weight Context ✅

**Feature:** Show user's weight next to each category as context

**UI:**
```typescript
<div className="text-sm text-gray-600 dark:text-gray-400">
  {category.weight !== null ? (
    <>
      Your weight: <span className="font-semibold">{category.weight}</span> -
      <span className="ml-1">{getWeightLabel(category.weight)}</span>
    </>
  ) : (
    <span className="italic">
      Weight not set
      <Link href="/dashboard/weights" className="ml-2 text-blue-600">
        Set weights
      </Link>
    </span>
  )}
</div>
```

**Expected Time:** 15 minutes

### Step 9: Polish & Responsive Design ✅

**Tasks:**
1. Mobile-responsive layout
2. Dark mode support
3. Loading states
4. Empty states
5. Error messages
6. Success indicators
7. Keyboard navigation
8. Touch gestures
9. Accessibility (ARIA labels)

**Expected Time:** 2 hours

### Step 10: Testing & Edge Cases ✅

**Test Cases:**
1. No categories (redirect to categories page)
2. No weights set (show warning but allow rating)
3. House deleted mid-rating (redirect to houses list)
4. Category deactivated (don't show in list)
5. Network error during save (show error, keep local state)
6. Rapid rating changes (debouncing works)
7. Navigate away before save (cleanup timeout)
8. Very long notes (character limit enforced)
9. Multiple tabs (each saves independently)
10. Mobile touch interactions

**Expected Time:** 1.5 hours

## User Flows

### First-Time Rating Flow

```
1. User clicks "Rate This House" from house details page
   ↓
2. Navigates to /dashboard/houses/[houseId]/rate
   ↓
3. Page loads:
   - House details shown at top
   - All active categories displayed
   - Existing ratings pre-filled (if any)
   - First incomplete group auto-expands
   ↓
4. User moves slider to rate first category
   ↓
5. Rating updates instantly (optimistic)
   ↓
6. After 500ms, rating saves to database
   ↓
7. Progress stats update
   ↓
8. User continues rating categories
   ↓
9. When group complete, auto-collapse + expand next
   ↓
10. User can leave anytime (all ratings auto-saved)
```

### Editing Existing Ratings Flow

```
1. User returns to /dashboard/houses/[houseId]/rate
   ↓
2. Existing ratings load and pre-fill sliders
   ↓
3. All groups collapsed (already rated)
   ↓
4. User expands group to edit
   ↓
5. Changes rating with slider
   ↓
6. Auto-saves after 500ms
   ↓
7. Group stays open (doesn't auto-collapse if already complete)
```

## Integration Points

### Module 2: Categories
- Only display **active** categories (`is_active = true`)
- Group by `category_group` field
- Use category name and description

### Module 3: Weights
- Display user's weight per category (context)
- Use same color system (gray → green gradient)
- Link to weights page if not set

### Module 5: Houses
- "Rate This House" button on house details page
- Show rating progress on house card ("25/34 rated - 74%")
- Show average rating on house card ("Avg: 3.8/5.0")
- Link back to house details after rating

### Module 6: Scoring (Future)
- House ratings used for score calculation
- Formula: `Σ(Household Avg Weight × Household Avg Rating)`
- Show which categories contributed most to score

## Performance Optimizations

### 1. Debounced Auto-Save
- Ratings: 500ms debounce
- Notes: 1000ms debounce
- Prevents excessive API calls

### 2. Optimistic Updates
- Update UI immediately
- Sync to DB in background
- Revert only on error

### 3. Grouped Rendering
- Collapse completed groups
- Reduces DOM size
- Faster scrolling

### 4. Memoization
```typescript
const stats = useMemo(() => calculateStats(), [categories])
const groupedCategories = useMemo(() =>
  groupBy(categories, 'category_group'),
  [categories]
)
```

## Edge Cases & Error Handling

### 1. No Active Categories
```typescript
if (categories.length === 0) {
  return (
    <EmptyState
      message="No categories found. Please set up categories first."
      action={
        <Link href="/dashboard/categories">Go to Categories</Link>
      }
    />
  )
}
```

### 2. User Hasn't Set Weights
- **Allow rating anyway** (weights optional)
- Show gentle reminder: "You haven't set category weights yet. Ratings will be saved, but weights help prioritize what matters most to you."
- Link to weights page

### 3. House Deleted Mid-Rating
```typescript
if (houseError || !house) {
  router.push('/dashboard/houses')
  return
}
```

### 4. Network Error During Save
```typescript
const saveRating = async (categoryId: string, rating: number) => {
  try {
    const { error } = await supabase.from('house_ratings').upsert(...)

    if (error) throw error

    toast.success('Rating saved')
  } catch (err) {
    console.error('Failed to save rating:', err)
    toast.error('Failed to save. Please try again.')

    // Revert optimistic update
    loadRatings()
  }
}
```

### 5. Category Deactivated After Rating
- Don't show deactivated categories in UI
- Keep existing ratings in database (for history)
- Exclude from progress calculation

## File Structure

```
packages/web/app/dashboard/houses/[houseId]/rate/
└── page.tsx (main rating page)

packages/web/components/rating/ (optional - if we extract components)
├── RatingSlider.tsx
├── CategoryRatingCard.tsx
├── RatingStats.tsx
└── CategoryGroupSection.tsx
```

## Total Effort Estimate

| Step | Task | Time |
|------|------|------|
| 1 | Page structure | 30 min |
| 2 | Load data | 45 min |
| 3 | Rating slider | 1 hour |
| 4 | Auto-save logic | 1 hour |
| 5 | Notes functionality | 1 hour |
| 6 | Progress tracking | 30 min |
| 7 | Group collapse | 45 min |
| 8 | Weight context | 15 min |
| 9 | Polish & responsive | 2 hours |
| 10 | Testing | 1.5 hours |
| **TOTAL** | | **9.25 hours** |

## Success Criteria

### Functional Requirements
- ✅ User can rate each category on 0-5 scale
- ✅ Ratings auto-save within 1 second
- ✅ Progress tracking shows completion percentage
- ✅ Groups expand/collapse smoothly
- ✅ Notes save independently per category
- ✅ User's weights displayed for context
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ Handles edge cases gracefully

### User Experience Goals
- **Fast**: Page loads in < 2 seconds
- **Intuitive**: No instructions needed
- **Forgiving**: Auto-save prevents data loss
- **Accessible**: Keyboard navigation works
- **Consistent**: Matches Module 3 UX patterns

## Next Steps After Implementation

1. **Test with real users**
   - Get feedback on rating labels
   - Validate slider UX
   - Check if notes are useful

2. **Monitor metrics**
   - Completion rate (target: >80%)
   - Time to rate one house (expect: 5-10 min)
   - Notes usage (expect: 20-30%)
   - Average rating (expect: ~3.0)

3. **Iterate based on feedback**
   - Adjust rating labels if confusing
   - Add features users request
   - Fix any UX pain points

4. **Implement Module 6: Scoring**
   - Use ratings + weights to calculate scores
   - Show final house rankings
   - Enable side-by-side comparison

## Open Design Questions

### 1. Rating Labels?
**Option A (Simple):**
- 0: Poor
- 1: Below Average
- 2: Average
- 3: Good
- 4: Very Good
- 5: Excellent

**Option B (Descriptive):**
- 0: Does not meet needs
- 1: Significantly below expectations
- 2: Below expectations
- 3: Meets expectations
- 4: Exceeds expectations
- 5: Far exceeds expectations

**Recommendation:** Option A (simpler, less wordy)

### 2. Notes Required or Optional?
**Recommendation:** Optional (don't force, but encourage with placeholder text)

### 3. Show Other Members' Ratings?
**Recommendation:** No (avoid bias - rate independently, see others in Module 6)

### 4. Allow Rating Without Weights?
**Recommendation:** Yes (weights optional for rating, but recommended)

### 5. Auto-Collapse Completed Groups?
**Recommendation:** Yes (same as Module 3 for consistency)

### 6. Character Limit for Notes?
**Recommendation:** 500 characters per category

## Implementation Checklist

### Pre-Implementation
- [x] Module 5 (House Management) complete
- [x] Database schema confirmed
- [x] Design approved
- [ ] Questions resolved

### Implementation
- [ ] Step 1: Page structure
- [ ] Step 2: Load data
- [ ] Step 3: Rating slider
- [ ] Step 4: Auto-save
- [ ] Step 5: Notes
- [ ] Step 6: Progress
- [ ] Step 7: Groups
- [ ] Step 8: Weight context
- [ ] Step 9: Polish
- [ ] Step 10: Testing

### Post-Implementation
- [ ] Code review
- [ ] User testing
- [ ] Performance check
- [ ] Accessibility audit
- [ ] Documentation update

---

## Ready to Start? 🚀

This plan is comprehensive and ready for implementation. Module 5 (House Management) is complete, so we can now build the rating interface that allows users to evaluate each house across all their categories.

**Estimated completion time:** 1-2 days of focused work

Would you like to proceed with implementation?
