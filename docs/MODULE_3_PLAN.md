# Module 3: Category Weighting Interface - Implementation Plan

## Overview

Module 3 allows each household member to rate the importance of each category on a scale of 0-5. These individual ratings are aggregated into household-wide average weights that will be used to calculate final house scores.

## Key Concepts

### Individual vs Household Weights

- **Individual Weights**: Each user rates each category (0-5)
- **Household Weights**: Average of all users' ratings for each category
- **Final House Score**: `Σ(Household Weight × Household Rating for that category)`

### Example Calculation

```
Category: "Number of Bedrooms"

User Ratings:
- Jane (owner): 5 (very important)
- John (member): 3 (somewhat important)

Household Weight = (5 + 3) / 2 = 4.0

Later, when rating House A:
- Jane rates "Number of Bedrooms" as 4/5
- John rates "Number of Bedrooms" as 5/5
- Household Rating = (4 + 5) / 2 = 4.5

Contribution to House A score = 4.0 × 4.5 = 18.0 points
```

## Database Structure

Already exists in `category_weights` table:
```sql
CREATE TABLE category_weights (
  id UUID PRIMARY KEY,
  household_user_id UUID REFERENCES household_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  weight INTEGER CHECK (weight >= 0 AND weight <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_user_id, category_id)
);
```

## UI/UX Design

### Page Layout: `/dashboard/weights`

```
┌─────────────────────────────────────────────────────┐
│ HouseRater | Back to Dashboard                      │
├─────────────────────────────────────────────────────┤
│ Category Weights                                     │
│ Rate how important each category is to you (0-5)    │
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │Your Progress │ │Categories    │ │Avg Weight    ││
│ │ 15 / 34      │ │ 34 active    │ │ 3.2 / 5.0    ││
│ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                      │
│ [Save All Changes]  [Reset All to Default (3)]     │
│                                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                      │
│ Features (10 categories)              Progress: 8/10│
│ ┌──────────────────────────────────────────────────┐│
│ │ Number of Bedrooms                         ●●●●●○││
│ │ [0] [1] [2] [3] [4] [5]               Current: 4││
│ ├──────────────────────────────────────────────────┤│
│ │ Number of Bathrooms                        ●●●○○○││
│ │ [0] [1] [2] [3] [4] [5]               Current: 3││
│ ├──────────────────────────────────────────────────┤│
│ │ Garage Spaces                              ●●●●●●││
│ │ [0] [1] [2] [3] [4] [5]               Current: 5││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ Size (10 categories)                      Progress: 0/10│
│ ┌──────────────────────────────────────────────────┐│
│ │ Total Square Footage                       ○○○○○○││
│ │ [0] [1] [2] [3] [4] [5]          Not rated yet  ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ [Additional groups collapsed by default...]         │
└─────────────────────────────────────────────────────┘
```

### Interactive Elements

1. **Rating Buttons (0-5)**
   - Clickable buttons for each weight value
   - Visual feedback on hover
   - Active state shows selected weight
   - Color coding: 0=gray, 1-2=orange, 3=yellow, 4-5=green

2. **Visual Indicators**
   - Filled/unfilled circles showing current rating
   - Progress bar per group
   - Overall completion percentage

3. **Save Behavior**
   - Auto-save on each change (debounced 500ms)
   - OR batch save with "Save All Changes" button
   - Loading state during save

## Implementation Strategy

### Option A: Auto-Save (Recommended)

**Pros:**
- No "Save" button needed
- Never lose progress
- Modern UX pattern

**Cons:**
- More API calls
- Need debouncing to avoid spam

### Option B: Manual Save

**Pros:**
- Fewer API calls
- User can review before committing

**Cons:**
- User might forget to save
- Need unsaved changes warning

**Recommendation: Use Option A (auto-save) with debouncing**

## Component Structure

```
WeightsPage (Client Component)
├── WeightsStats (completion, avg weight)
├── WeightsActions (save/reset buttons if manual save)
├── CategoryGroupSection (for each group)
│   ├── GroupHeader (name, progress)
│   └── CategoryWeightRow[] (each category)
│       ├── CategoryName
│       ├── WeightSelector (0-5 buttons)
│       └── VisualIndicator (dots/stars)
└── InfoBox (explanation)
```

## Data Flow

### 1. Initial Load

```typescript
// Fetch user's existing weights
const { data: weights } = await supabase
  .from('category_weights')
  .select('category_id, weight')
  .eq('household_user_id', currentUser.id)

// Fetch active categories
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('household_id', household.id)
  .eq('is_active', true)
  .order('category_group, name')

// Merge: categories with their weights (default 3 if no weight)
const categoriesWithWeights = categories.map(cat => ({
  ...cat,
  weight: weights.find(w => w.category_id === cat.id)?.weight ?? 3
}))
```

### 2. Update Weight

```typescript
const handleWeightChange = async (categoryId: string, weight: number) => {
  // Optimistic update
  setCategories(categories.map(cat =>
    cat.id === categoryId ? { ...cat, weight } : cat
  ))

  // Upsert to database
  const { error } = await supabase
    .from('category_weights')
    .upsert({
      household_user_id: currentUser.id,
      category_id: categoryId,
      weight: weight
    }, {
      onConflict: 'household_user_id,category_id'
    })

  if (error) {
    // Revert optimistic update
    console.error('Failed to save weight')
  }
}
```

### 3. Calculate Statistics

```typescript
const calculateStats = () => {
  const rated = categories.filter(cat => cat.weight !== null).length
  const total = categories.length
  const avgWeight = categories.reduce((sum, cat) => sum + (cat.weight ?? 3), 0) / total

  return { rated, total, avgWeight }
}
```

## API Endpoints Needed

**None! All operations use direct Supabase queries.**

## Styling Approach

### Weight Value Colors

```typescript
const getWeightColor = (weight: number) => {
  if (weight === 0) return 'gray'
  if (weight <= 2) return 'orange'
  if (weight === 3) return 'yellow'
  return 'green' // 4-5
}
```

### Rating Button Styles

```css
/* Unselected */
.weight-btn {
  @apply px-4 py-2 border-2 border-gray-300 rounded-lg
         hover:border-blue-500 transition-colors;
}

/* Selected */
.weight-btn-active {
  @apply px-4 py-2 border-2 border-blue-600 bg-blue-50
         font-semibold text-blue-600;
}
```

## Features to Implement

### Phase 1: Core Functionality
1. ✅ Display all active categories grouped by type
2. ✅ Show current weight for each category (default 3)
3. ✅ Allow user to select weight 0-5
4. ✅ Auto-save weight changes (debounced)
5. ✅ Show save status (saving/saved)
6. ✅ Calculate and display progress statistics

### Phase 2: Enhanced UX
1. ✅ Visual weight indicators (dots/circles)
2. ✅ Group-level progress bars
3. ✅ Collapsible groups (expand/collapse)
4. ✅ "Quick set all to 3" button per group
5. ✅ Overall completion percentage

### Phase 3: Advanced Features (Future)
1. ⏭️ Show household average for each category
2. ⏭️ Compare your weights to household average
3. ⏭️ Filter: Show only unrated categories
4. ⏭️ Keyboard navigation (arrow keys, number keys)
5. ⏭️ Bulk actions (set all in group to X)

## Edge Cases to Handle

### 1. No Categories
```typescript
if (categories.length === 0) {
  return <EmptyState message="No active categories. Add some in Category Management." />
}
```

### 2. Category Deleted Mid-Session
- If category is deleted while user is rating, remove from UI
- Existing weights remain in database (orphaned but harmless)

### 3. Network Error During Save
- Show error message
- Retry button
- Don't lose user's selection (optimistic update)

### 4. Multiple Tabs/Users
- No real-time sync needed (each user's weights are independent)
- Reload on focus to get latest if needed

### 5. Inactive Categories
- Don't show in weights interface
- Existing weights for inactive categories remain (for if reactivated)

## User Flow

### First-Time User (No Weights Set)

```
1. User clicks "Set Category Weights" from dashboard
   ↓
2. See all categories with default weight of 3
   ↓
3. Instructions: "Rate each category 0-5..."
   ↓
4. User adjusts weights for important categories
   ↓
5. Auto-saves after each change
   ↓
6. Shows progress: "15 of 34 rated"
   ↓
7. Can leave anytime (progress saved)
```

### Returning User (Has Weights)

```
1. User clicks "Set Category Weights"
   ↓
2. See categories with saved weights
   ↓
3. Can adjust any weight
   ↓
4. Changes auto-save
   ↓
5. "All weights set" confirmation
```

## Performance Considerations

### Optimization Strategies

1. **Debounced Auto-Save**: Wait 500ms after last change before saving
2. **Optimistic Updates**: Update UI immediately, sync to DB in background
3. **Grouped Queries**: Fetch all weights in one query, not per category
4. **Virtualization**: If >50 categories, use virtual scrolling (react-window)

### Expected Load

- 34 categories per household (default)
- ~10 custom categories (average)
- Total: ~44 categories to display
- **No virtualization needed** (under 50)

## Testing Checklist

### Functionality Tests
- [ ] Display all active categories
- [ ] Show existing weights correctly
- [ ] Update weight when clicked
- [ ] Auto-save after debounce delay
- [ ] Calculate progress accurately
- [ ] Calculate average weight correctly
- [ ] Group categories by type
- [ ] Collapse/expand groups
- [ ] Reset to default (3)
- [ ] Handle save errors gracefully

### UI/UX Tests
- [ ] Responsive on mobile
- [ ] Dark mode works
- [ ] Hover states on buttons
- [ ] Active state on selected weight
- [ ] Loading indicator during save
- [ ] Success message after save
- [ ] Visual weight indicators correct
- [ ] Keyboard accessible

### Edge Case Tests
- [ ] No categories active
- [ ] All weights already set
- [ ] Network error during save
- [ ] Rapid clicking (debounce works)
- [ ] Very long category names
- [ ] Navigate away (weights saved)

## Success Metrics

1. **Completion Rate**: What % of users set all weights?
2. **Time to Complete**: How long to rate all categories?
3. **Average Weight**: What's typical importance? (expect ~3.0)
4. **Adjustment Rate**: How often do users come back to adjust?

## Integration with Other Modules

### Module 2 (Categories)
- Only show **active** categories
- If category deactivated, hide from weights page
- If new category added, show with default weight 3

### Module 5 (House Rating)
- Weights influence final score calculation
- Show weight next to category when rating houses
- "High priority" indicator for weight 4-5

### Module 6 (Scoring)
- Use household average weights for calculations
- Show which categories matter most to household
- Explain score: "Location (weight 4.5) contributed 18 points"

## Open Questions for Review

1. **Auto-save vs Manual Save?**
   - Recommendation: Auto-save (better UX, modern pattern)

2. **Default weight value?**
   - Recommendation: 3 (middle of scale, encourages user to adjust)

3. **Show household average immediately?**
   - Recommendation: No, not until Module 6 (keep it simple)

4. **Allow weight of 0?**
   - Recommendation: Yes (means "not important at all")

5. **Collapsible groups?**
   - Recommendation: Yes, all collapsed by default except first

6. **Bulk actions?**
   - Recommendation: Phase 2 (not MVP)

7. **Visual indicators?**
   - Recommendation: Filled circles (●●●○○○) - simple and clear

8. **Mobile-first approach?**
   - Recommendation: Yes, optimize for thumb-friendly buttons

## Implementation Order

### Step 1: Basic Page Structure
- Create `/dashboard/weights/page.tsx`
- Fetch categories and existing weights
- Display categories in a list

### Step 2: Weight Selection UI
- Add 0-5 button group for each category
- Highlight selected weight
- Handle click to change weight

### Step 3: Save Functionality
- Implement auto-save with debounce
- Optimistic updates
- Error handling

### Step 4: Statistics & Progress
- Calculate completion rate
- Calculate average weight
- Display stats at top

### Step 5: Grouping & Organization
- Group categories by type
- Add group headers
- Add progress per group

### Step 6: Polish & UX
- Visual weight indicators
- Loading states
- Success messages
- Dark mode
- Responsive design

### Step 7: Testing
- Test all edge cases
- Test on mobile
- Test with multiple users

## Estimated Effort

- **Step 1-2**: 1-2 hours (basic structure)
- **Step 3**: 1 hour (save logic)
- **Step 4**: 30 minutes (statistics)
- **Step 5**: 1 hour (grouping)
- **Step 6**: 1-2 hours (polish)
- **Step 7**: 1 hour (testing)

**Total: 5-7 hours** for complete implementation

## Next Steps After Module 3

Once category weighting is complete:
1. **Module 4**: House Management (add houses)
2. **Module 5**: House Rating (rate houses on categories)
3. **Module 6**: Scoring & Comparison (calculate final scores using weights)

---

## Questions for Review

Please review this plan and let me know:

1. Do you want **auto-save** or **manual save** button?
2. Should groups be **collapsible** or always expanded?
3. Do you want **visual indicators** (dots) or just numbers?
4. Any specific design preferences for the rating buttons?
5. Should we show a **tutorial/guide** on first use?
6. Any other features you'd like in this module?

Once you approve the plan, I'll start implementing!
