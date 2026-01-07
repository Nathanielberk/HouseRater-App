# Module 4: House Rating Interface - Implementation Plan

## Overview

Module 4 enables household members to rate individual houses across all active categories. Each member rates each house independently, and these ratings (combined with category weights from Module 3) will be used to calculate final scores in Module 6.

## Key Concepts

### Rating Flow
1. User selects a house to rate
2. House details displayed (address, price, images, etc.)
3. User rates house on each category (0-5 scale)
4. Ratings auto-save as user progresses
5. User can see their progress and overall completion

### Data Model

```typescript
// House rating for a single category by a single user
HouseRating {
  id: UUID
  household_user_id: UUID  // Who rated it
  house_id: UUID           // Which house
  category_id: UUID        // Which category
  rating: INTEGER (0-5)    // The rating
  notes?: TEXT             // Optional notes per category
  created_at: TIMESTAMP
  updated_at: TIMESTAMP

  UNIQUE(household_user_id, house_id, category_id)
}
```

### Rating vs Weight vs Score (Important Distinction!)

**Example to clarify:**

```
Category: "Number of Bedrooms"

WEIGHT (Module 3):
- Jane says: "Bedrooms are very important to me" → Weight: 5
- John says: "Bedrooms are somewhat important" → Weight: 3
- Household Average Weight: (5 + 3) / 2 = 4.0

RATING (Module 4 - this module):
- House A has 4 bedrooms
- Jane rates House A's bedrooms: 4/5 (good, but not perfect)
- John rates House A's bedrooms: 5/5 (perfect for him)
- Household Average Rating: (4 + 5) / 2 = 4.5

SCORE (Module 6 - future):
- House A's bedroom score = Weight × Rating = 4.0 × 4.5 = 18.0 points
```

**Key difference:**
- **Weight**: "How important is this category to me?" (set once, applies to all houses)
- **Rating**: "How well does THIS house perform in this category?" (set per house)

## Database Schema

### Table: `house_ratings`

Already exists (from initial schema):

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

**No schema changes needed!** ✅

## UI/UX Design

### Page Layout: `/dashboard/houses/[houseId]/rate`

```
┌─────────────────────────────────────────────────────────┐
│ HouseRater | Back to House Details                       │
├─────────────────────────────────────────────────────────┤
│ Rate: 123 Main St, Anytown                              │
│ $450,000 | 3 bed, 2 bath | 1,850 sqft                   │
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│ │Your Progress │ │Rated         │ │Avg Rating    │     │
│ │ 25 / 34      │ │ 25 categories│ │ 3.8 / 5.0    │     │
│ └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│ Features (10 categories)              Progress: 8/10    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Number of Bedrooms                    Weight: 5     │ │
│ │ "This is absolutely necessary!"                     │ │
│ │                                                      │ │
│ │ [0] [1] [2] [3] [4] [5]           Current: 4        │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │ │
│ │ Slider: ●━━━━━━━━━━━━━━━●━━━━━━○                   │ │
│ │                                                      │ │
│ │ 📝 Notes (optional)                                  │ │
│ │ [4 bedrooms, good size, master suite is nice...]    │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Number of Bathrooms                   Weight: 3     │ │
│ │ "This would be nice"                                │ │
│ │                                                      │ │
│ │ [0] [1] [2] [3] [4] [5]           Current: -        │ │
│ │ Not rated yet                                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Size (10 categories)                      Progress: 0/10│
│ [Collapsed by default...]                               │
└─────────────────────────────────────────────────────────┘
```

### Key Features

#### 1. **House Context Bar**
- Show house address, price, basic stats
- Quick navigation back to house details
- Visual reminder of which house is being rated

#### 2. **Category Display**
- Show **category name**
- Show **user's weight** for this category (from Module 3)
- Show **weight label** (e.g., "This is absolutely necessary!")
- Show current rating or "Not rated yet"

#### 3. **Rating Input Methods**

**Option A: Slider (Recommended)**
- Matches Module 3 UX (consistency)
- Easy to adjust
- Visual feedback

**Option B: Button Grid**
- 0-5 buttons in a row
- Click to select
- More precise, less drag

**Option C: Hybrid**
- Slider for quick rating
- Number display shows exact value
- Click numbers to jump to value

**Recommendation: Option A (Slider) for consistency with Module 3**

#### 4. **Visual Feedback**
- **Rating colors**: Use same black-to-green gradient as Module 3
- **Progress indicators**: Per group and overall
- **Weight reminder**: Show user's weight to provide context
- **Auto-save indicator**: "Saving..." when rating changes

#### 5. **Notes per Category (Optional)**
- Expandable text area per category
- "Add notes..." placeholder
- Auto-save notes with debouncing
- Character limit: 500 chars

#### 6. **Smart Grouping**
- Same groups as Module 3 (Features, Size, Neighborhood, etc.)
- Collapsible groups
- Auto-expand first incomplete group
- Progress bar per group

## Component Structure

```
RateHousePage (Client Component)
├── HouseContextBar (house details, back button)
├── RatingStats (progress, avg rating)
├── CategoryGroupSection[] (for each group)
│   ├── GroupHeader (name, progress)
│   └── CategoryRatingCard[] (each category)
│       ├── CategoryName + Weight Display
│       ├── RatingSlider (0-5)
│       ├── RatingLabel ("Not rated yet" / "Good")
│       └── NotesInput (expandable, optional)
└── InfoBox (explanation, tips)
```

## Data Flow

### 1. Initial Load

```typescript
// GET house details
const { data: house } = await supabase
  .from('houses')
  .select('*')
  .eq('id', houseId)
  .single()

// GET active categories
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('household_id', household.id)
  .eq('is_active', true)
  .order('category_group, name')

// GET user's weights (to show context)
const { data: weights } = await supabase
  .from('category_weights')
  .select('category_id, weight')
  .eq('household_user_id', currentUser.id)

// GET existing ratings for this house
const { data: ratings } = await supabase
  .from('house_ratings')
  .select('*')
  .eq('household_user_id', currentUser.id)
  .eq('house_id', houseId)

// Merge: categories + weights + ratings
const categoriesWithData = categories.map(cat => ({
  ...cat,
  weight: weights.find(w => w.category_id === cat.id)?.weight ?? null,
  rating: ratings.find(r => r.category_id === cat.id)?.rating ?? null,
  notes: ratings.find(r => r.category_id === cat.id)?.notes ?? ''
}))
```

### 2. Update Rating

```typescript
const handleRatingChange = async (categoryId: string, rating: number) => {
  // Optimistic update
  setCategories(categories.map(cat =>
    cat.id === categoryId ? { ...cat, rating } : cat
  ))

  // Debounced save (500ms)
  clearTimeout(saveTimeout)
  const timeout = setTimeout(async () => {
    await saveRating(categoryId, rating)
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
      rating: rating
    }, {
      onConflict: 'household_user_id,house_id,category_id'
    })

  if (error) {
    console.error('Failed to save rating')
    // Revert optimistic update
  }
}
```

### 3. Update Notes

```typescript
const handleNotesChange = (categoryId: string, notes: string) => {
  // Optimistic update
  setCategories(categories.map(cat =>
    cat.id === categoryId ? { ...cat, notes } : cat
  ))

  // Debounced save (1000ms - longer for typing)
  clearTimeout(notesTimeout)
  const timeout = setTimeout(async () => {
    await saveNotes(categoryId, notes)
  }, 1000)
  setNotesTimeout(timeout)
}

const saveNotes = async (categoryId: string, notes: string) => {
  // Update existing rating record with notes
  const { error } = await supabase
    .from('house_ratings')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('household_user_id', currentUser.id)
    .eq('house_id', houseId)
    .eq('category_id', categoryId)

  if (error) {
    console.error('Failed to save notes')
  }
}
```

### 4. Calculate Statistics

```typescript
const calculateStats = () => {
  const total = categories.length
  const rated = categories.filter(cat => cat.rating !== null).length
  const ratedCategories = categories.filter(cat => cat.rating !== null)
  const avgRating = ratedCategories.length > 0
    ? ratedCategories.reduce((sum, cat) => sum + (cat.rating || 0), 0) / ratedCategories.length
    : 0

  return { rated, total, avgRating, percentage: (rated / total) * 100 }
}
```

## Rating Label System

Similar to Module 3, provide friendly labels for ratings:

```typescript
const getRatingLabel = (rating: number | null): string => {
  if (rating === null) return 'Not rated yet'

  const labels = [
    'Poor',              // 0
    'Below Average',     // 1
    'Average',           // 2
    'Good',              // 3
    'Very Good',         // 4
    'Excellent'          // 5
  ]

  return labels[rating] || 'Not rated'
}
```

**Alternative (more descriptive):**

```typescript
const getRatingLabel = (rating: number | null): string => {
  if (rating === null) return 'Not rated yet'

  const labels = [
    'Does not meet needs',           // 0
    'Significantly below expectations', // 1
    'Below expectations',            // 2
    'Meets expectations',            // 3
    'Exceeds expectations',          // 4
    'Far exceeds expectations'       // 5
  ]

  return labels[rating] || 'Not rated'
}
```

## Features to Implement

### Phase 1: Core Rating Functionality
1. ✅ Display house details at top
2. ✅ Load all active categories
3. ✅ Show user's weight per category (context)
4. ✅ Rating slider (0-5) per category
5. ✅ Auto-save ratings (debounced)
6. ✅ Progress tracking (per group, overall)
7. ✅ Visual feedback (colors, labels)

### Phase 2: Enhanced UX
1. ✅ Notes per category (expandable textarea)
2. ✅ Auto-save notes (debounced 1000ms)
3. ✅ Smart group collapse/expand
4. ✅ "Complete" badges on finished groups
5. ✅ Average rating calculation
6. ✅ Rating labels (Poor → Excellent)

### Phase 3: Navigation & Context
1. ✅ Back to house details
2. ✅ Navigate between houses without leaving rating page
3. ✅ Show which categories have notes (indicator)
4. ✅ Jump to unrated categories
5. ✅ "Mark all as N/A" for irrelevant categories

### Phase 4: Advanced Features (Future)
1. ⏭️ Side-by-side comparison while rating
2. ⏭️ Upload photos per category
3. ⏭️ Voice notes per category
4. ⏭️ Copy ratings from similar house
5. ⏭️ Suggested ratings based on house specs
6. ⏭️ Real-time sync (see other members' ratings)

## Edge Cases to Handle

### 1. No Categories
```typescript
if (categories.length === 0) {
  return <EmptyState message="No categories found. Set up categories first." />
}
```

### 2. User Hasn't Set Weights
- Allow rating anyway (weights optional for rating)
- Show message: "You haven't set category weights yet. Ratings will be saved, but weights help prioritize."
- Link to weights page

### 3. House Deleted Mid-Rating
- Detect 404 on house fetch
- Redirect to houses list with message

### 4. Category Deactivated After Rating
- Don't show deactivated categories in rating interface
- Keep existing ratings in database (for history)
- Ratings don't count toward completion percentage

### 5. Network Error During Save
- Show error toast
- Retry button
- Keep optimistic update (user doesn't lose progress)

### 6. Multiple Tabs/Users
- No real-time sync needed (each user rates independently)
- Refresh on focus to get latest if needed

## User Flow

### First-Time Rating a House

```
1. User clicks "Rate this house" from house details page
   ↓
2. Navigates to /dashboard/houses/[houseId]/rate
   ↓
3. Sees house details at top + all categories
   ↓
4. First incomplete group auto-expands
   ↓
5. User moves slider to rate first category
   ↓
6. Card color changes instantly (optimistic)
   ↓
7. After 500ms, rating auto-saves
   ↓
8. User continues rating categories
   ↓
9. When group complete, auto-collapse + expand next
   ↓
10. Progress stats update in real-time
   ↓
11. User can leave anytime (progress saved)
   ↓
12. Return later to complete
```

### Editing Existing Ratings

```
1. User returns to /dashboard/houses/[houseId]/rate
   ↓
2. Sees existing ratings pre-filled
   ↓
3. All groups collapsed initially (already rated)
   ↓
4. User expands group to edit
   ↓
5. Changes rating with slider
   ↓
6. Auto-saves after 500ms
   ↓
7. Group stays open (doesn't auto-collapse if already complete)
```

## Integration with Other Modules

### Module 2 (Categories)
- Only show **active** categories
- If category deactivated, hide from rating interface
- Group categories same way as Module 3

### Module 3 (Weights)
- Display user's weight per category for context
- Use same color system (black → green)
- Link to weights page if not set

### Module 5 (Houses)
- "Rate this house" button on house details page
- Show rating progress on house card (e.g., "25/34 rated")
- Link back to house details after rating

### Module 6 (Scoring)
- House ratings used for score calculation
- Formula: `Σ(Household Avg Weight × Household Avg Rating)`
- Show which categories contributed most to score

## Performance Considerations

### Optimization Strategies

1. **Debounced Auto-Save**
   - Ratings: 500ms debounce
   - Notes: 1000ms debounce (typing delay)
   - Batch updates where possible

2. **Optimistic Updates**
   - Update UI immediately
   - Sync to DB in background
   - Revert only on error

3. **Lazy Loading**
   - Load house details first
   - Load categories + ratings in parallel
   - Load images on demand

4. **Virtualization**
   - Not needed for ~40 categories
   - Consider if custom categories exceed 100

### Expected Load

- 34 default categories
- ~10 custom categories (average)
- Total: ~44 categories to rate per house
- No virtualization needed

## Testing Checklist

### Functionality Tests
- [ ] Load house details correctly
- [ ] Display all active categories
- [ ] Show user's weights per category
- [ ] Show existing ratings correctly
- [ ] Update rating when slider moved
- [ ] Auto-save rating after debounce
- [ ] Calculate progress accurately
- [ ] Calculate average rating correctly
- [ ] Group categories by type
- [ ] Collapse/expand groups
- [ ] Save notes per category
- [ ] Auto-save notes after typing
- [ ] Handle missing weights gracefully
- [ ] Handle network errors gracefully

### UI/UX Tests
- [ ] Responsive on mobile
- [ ] Dark mode works
- [ ] Hover states on sliders
- [ ] Visual rating colors correct (black → green)
- [ ] Loading indicator during save
- [ ] Success message after save
- [ ] Keyboard accessible
- [ ] Notes textarea expands properly

### Edge Case Tests
- [ ] No categories active
- [ ] User hasn't set weights
- [ ] House deleted mid-rating
- [ ] Category deactivated mid-rating
- [ ] Network error during save
- [ ] Very long notes (500+ chars)
- [ ] Rapid rating changes (debounce works)
- [ ] Navigate away before save completes

## Success Metrics

1. **Completion Rate**: What % of users rate all categories?
2. **Time to Complete**: How long to rate one house?
3. **Notes Usage**: What % of ratings have notes?
4. **Average Rating**: What's typical rating? (expect ~3.0)
5. **Edit Rate**: How often do users come back to adjust?

## Open Questions for Review

1. **Rating scale labels?**
   - Option A: Simple (Poor → Excellent)
   - Option B: Descriptive (Does not meet needs → Far exceeds expectations)
   - Recommendation: Option A (simpler, less wordy)

2. **Notes required or optional?**
   - Recommendation: Optional (don't force, but encourage)

3. **Show other members' ratings while rating?**
   - Recommendation: No (avoid bias, rate independently)

4. **Allow rating without setting weights first?**
   - Recommendation: Yes (weights optional for rating, but recommended)

5. **Auto-collapse completed groups?**
   - Recommendation: Yes (same as Module 3 for consistency)

6. **Character limit for notes?**
   - Recommendation: 500 chars per category

7. **Show house photos while rating?**
   - Recommendation: Phase 2 (nice to have, not MVP)

8. **Navigate between houses without leaving rating page?**
   - Recommendation: Phase 2 (next/previous house buttons)

## Implementation Order

### Step 1: Basic Page Structure
- Create `/dashboard/houses/[houseId]/rate/page.tsx`
- Fetch house details
- Fetch categories + existing ratings
- Display house context bar

### Step 2: Category Display
- Group categories by type
- Show category name + user's weight
- Display existing rating or "Not rated yet"

### Step 3: Rating Input
- Add slider (0-5) per category
- Handle rating change
- Optimistic update

### Step 4: Save Functionality
- Implement auto-save with debounce
- Upsert to database
- Error handling

### Step 5: Statistics & Progress
- Calculate completion rate
- Calculate average rating
- Display progress per group and overall

### Step 6: Notes Feature
- Add expandable textarea per category
- Auto-save notes (debounced 1000ms)
- Character limit validation

### Step 7: Visual Feedback & Polish
- Add color coding (black → green)
- Rating labels (Poor → Excellent)
- Loading states
- Success messages
- Dark mode
- Responsive design

### Step 8: Testing
- Test all edge cases
- Test on mobile
- Test with multiple houses
- Test notes functionality

## Estimated Effort

- **Step 1-2**: 2 hours (page structure, data loading)
- **Step 3**: 1 hour (rating sliders)
- **Step 4**: 1 hour (save logic)
- **Step 5**: 1 hour (statistics)
- **Step 6**: 1.5 hours (notes feature)
- **Step 7**: 2 hours (polish, colors, responsive)
- **Step 8**: 1.5 hours (testing)

**Total: 10 hours** for complete implementation

## House Management Prerequisite

**IMPORTANT**: Before implementing Module 4 (House Rating), we need to implement **House Management** first!

Users need houses to rate. This includes:

1. **Create House** - Add new houses to the household
2. **View Houses** - List all houses being considered
3. **House Details** - View details of a specific house
4. **Edit House** - Update house information
5. **Delete House** - Remove houses no longer under consideration

**Recommended Implementation Order:**

1. **Module 5: House Management** (create, list, view, edit, delete)
2. **Module 4: House Rating** (rate houses on categories)
3. **Module 6: Scoring & Comparison** (calculate and compare scores)

**Revised plan**: Let's implement House Management (Module 5) first, then come back to House Rating (Module 4).

---

## Next Steps

After reviewing this plan:

1. **Approve House Rating plan** (or suggest changes)
2. **Implement House Management first** (Module 5)
3. **Return to implement House Rating** (Module 4)
4. **Implement Scoring & Comparison** (Module 6)

---

## Questions for Review

Please review this plan and let me know:

1. Do you prefer **simple** ("Poor" → "Excellent") or **descriptive** ("Does not meet needs" → "Far exceeds expectations") rating labels?
2. Should notes be **required** or **optional** per category?
3. Should we show **other members' ratings** while rating, or keep it independent?
4. Do you want to implement **House Management (Module 5) first** before House Rating?
5. Any specific features you'd like in this module?

Once you approve, I'll create the House Management plan next!
