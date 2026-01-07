# Scoring Visualization Mockup - House Card

## Design Overview

This mockup shows the scoring visualization that will appear in each house card on the houses list page.

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Street View Image (600x300px)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
┌───────────────────────────────┬─────────────────────────────────┐
│ House Details                 │ Scoring Visualization           │
│                               │                                 │
│ 402 N 44th St                 │  Overall Match Score            │
│ Seattle, WA, 98103            │  ┌─────────────────────────┐   │
│                               │  │        87%              │   │
│ $1,200,000                    │  │  Great Match            │   │
│                               │  └─────────────────────────┘   │
│ 🛏️ 3 bed  🛁 1.5 bath         │                                 │
│ 📏 2,100 sqft                 │  Category Breakdown             │
│                               │                                 │
│                               │  Location (4 categories)        │
│                               │  ████ ████ ████ ████           │
│                               │                                 │
│                               │  Structure (6 categories)       │
│                               │  ████ ████ ████                │
│                               │  ████ ████ ████                │
│                               │                                 │
│                               │  Features (8 categories)        │
│                               │  ████ ████ ████ ████           │
│                               │  ████ ████ ████ ████           │
│                               │                                 │
│                               │  Neighborhood (3 categories)    │
│                               │  ████ ████ ████                │
│                               │                                 │
└───────────────────────────────┴─────────────────────────────────┘
│ [View Details] [Rate House] [Edit] [Archive]                   │
└─────────────────────────────────────────────────────────────────┘
```

## Chiclet Color Examples

Each small square (chiclet) represents one category, colored by its **weighted score**:

### Example: Location Group (All rated, high scores)
```
┌──────┬──────┬──────┬──────┐
│ 🟢 98│ 🟢 95│ 🟢 92│ 🟢 88│  ← All green = Great location
└──────┴──────┴──────┴──────┘
School  Safety Transit  Park
```

### Example: Features Group (Mixed ratings)
```
┌──────┬──────┬──────┬──────┐
│ 🟢 85│ 🟡 65│ 🔴 35│ 🟢 90│  ← Mixed colors = Some features good, some need work
└──────┴──────┴──────┴──────┘
│ 🟢 88│ 🟡 72│ ⚪ --│ ⚪ --│  ← Gray outline = Not rated yet
└──────┴──────┴──────┴──────┘
Kitchen Updated Garage  Yard     Basement  AC   Laundry  Storage
```

## Detailed Chiclet Specifications

### Size & Spacing
- **Chiclet size**: 14px × 14px (square)
- **Gap between chiclets**: 3px
- **Gap between groups**: 6px
- **Border radius**: 2px

### Color Scale (Based on Weighted Score)
| Score Range | Color      | Hex Code | Example Category          |
|-------------|------------|----------|---------------------------|
| 90-100%     | Emerald    | #10b981  | Excellent match           |
| 75-89%      | Green      | #22c55e  | Very good match           |
| 60-74%      | Lime       | #84cc16  | Good match                |
| 45-59%      | Yellow     | #eab308  | Moderate match            |
| 30-44%      | Orange     | #f97316  | Below expectations        |
| 0-29%       | Red        | #ef4444  | Poor match                |
| Unrated     | Gray       | Border only, transparent fill |

### States
1. **Default**: Solid color fill based on weighted score
2. **Hover**:
   - Slight scale transform (1.2x)
   - Tooltip appears showing:
     - Category name
     - Weighted score (e.g., "Kitchen: 85%")
     - Breakdown: "Rating: 4/5 × Weight: 4/5"
3. **Unrated**:
   - 1px gray border (#d1d5db)
   - Transparent fill
   - Tooltip on hover: "Category name: Not rated yet"

## Overall Score Calculation

**Formula**:
```
Overall Score = Σ(Category Weight × Category Rating) / Σ(Category Weight)
                ─────────────────────────────────────────────────────
                              Total Possible

Where:
- Category Weight: User's weight for category (0-5)
- Category Rating: User's rating for category (0-5)
- Total Possible: Sum of all weights × 5 (max rating)

Result displayed as percentage (0-100%)
```

**Example**:
- Category A: Weight 5, Rating 4 → Contribution: 20 (5×4)
- Category B: Weight 3, Rating 5 → Contribution: 15 (3×5)
- Category C: Weight 4, Rating 3 → Contribution: 12 (4×3)
- Total: 47 / 60 possible = 78% overall score

## Grid Layout Strategy

The chiclet grid adapts based on number of categories per group:

### Small Groups (1-4 categories)
- **Layout**: Single row
- **Example**: `████` (4 categories in one row)

### Medium Groups (5-8 categories)
- **Layout**: 2 rows, balanced
- **Example**:
  ```
  ████
  ████
  ```
  (4 categories per row)

### Large Groups (9-16 categories)
- **Layout**: 3-4 rows, balanced
- **Example**:
  ```
  ████
  ████
  ████
  ████
  ```
  (4 categories per row)

### Very Large Groups (16+ categories)
- **Layout**: Grid maintaining ~16:9 aspect ratio
- **Example** (20 categories):
  ```
  █████
  █████
  █████
  █████
  ```
  (5 columns × 4 rows)

## Responsive Behavior

### Desktop (≥ 1024px)
```
┌─────────────────────────────────────┐
│     Street View (full width)        │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│  House Details   │   Scoring Viz    │
│  (50% width)     │   (50% width)    │
└──────────────────┴──────────────────┘
```

### Mobile (< 1024px)
```
┌───────────────────────┐
│   Street View         │
└───────────────────────┘
┌───────────────────────┐
│   House Details       │
│   (full width)        │
└───────────────────────┘
┌───────────────────────┐
│   Scoring Viz         │
│   (full width)        │
└───────────────────────┘
```

## Example Scenarios

### Scenario 1: Perfect Match (90%+ overall)
```
Overall Score: 94% - Excellent Match! 🎉

Location:  ████ (all green)
Structure: ████ ████ (all green)
Features:  ████ ████ ████ (mostly green, one lime)
```
**Visual impression**: Sea of green chiclets = Great house!

### Scenario 2: Fixer-Upper in Great Location (65% overall)
```
Overall Score: 65% - Good Potential

Location:  ████ (all green - great neighborhood!)
Structure: ████ ████ (red/orange - needs renovation)
Features:  ████ ████ (yellow/orange - outdated)
```
**Visual impression**: Green location group, red/orange others = Renovation project in prime area

### Scenario 3: Partial Rating Progress (35% rated)
```
Overall Score: -- (Complete rating to see score)

Location:  ████ (green - rated)
Structure: ⚪⚪⚪⚪ (gray outlines - not rated)
Features:  ████ ⚪⚪⚪⚪ (partial - in progress)
```
**Visual impression**: Mix of colored and outlined chiclets = Rating in progress

## Technical Implementation Notes

### Data Structure
```typescript
interface CategoryScore {
  categoryId: string
  categoryName: string
  categoryGroup: string
  rating: number | null        // 0-5 or null if unrated
  weight: number               // 0-5 (user's weight)
  weightedScore: number | null // (rating × weight / 25) × 100 or null
}

interface HouseScore {
  houseId: string
  overallScore: number | null  // 0-100 percentage or null if incomplete
  categoryScores: CategoryScore[]
  ratedCount: number
  totalCount: number
}
```

### Tooltip Content
```typescript
// Rated category
"Kitchen: 85%
Rating: 4/5 ⭐
Weight: Important (4/5)
Contribution: 16/25"

// Unrated category
"Basement: Not rated yet
Click 'Rate House' to add rating"
```

### Color Mapping Function
```typescript
function getChicletColor(weightedScore: number | null): string {
  if (weightedScore === null) return 'transparent' // with gray border
  if (weightedScore >= 90) return '#10b981' // emerald
  if (weightedScore >= 75) return '#22c55e' // green
  if (weightedScore >= 60) return '#84cc16' // lime
  if (weightedScore >= 45) return '#eab308' // yellow
  if (weightedScore >= 30) return '#f97316' // orange
  return '#ef4444' // red
}
```

## Visual Examples (Pseudo-HTML)

### Overall Score Display
```html
<div class="overall-score">
  <div class="score-value text-4xl font-bold text-green-500">87%</div>
  <div class="score-label text-sm text-gray-500">Great Match</div>
</div>
```

### Chiclet Group
```html
<div class="chiclet-group">
  <div class="group-label text-xs text-gray-600 mb-1">Location (4)</div>
  <div class="chiclet-grid grid grid-cols-4 gap-1">
    <div class="chiclet bg-green-500" title="School: 95%"></div>
    <div class="chiclet bg-green-500" title="Safety: 92%"></div>
    <div class="chiclet bg-lime-500" title="Transit: 78%"></div>
    <div class="chiclet bg-green-500" title="Parks: 88%"></div>
  </div>
</div>
```

### Unrated Chiclet
```html
<div class="chiclet border border-gray-300 bg-transparent"
     title="Basement: Not rated yet">
</div>
```

## Next Steps

1. ✅ Design approved by user
2. ⏭️ Implement scoring calculation logic
3. ⏭️ Build chiclet heatmap component
4. ⏭️ Integrate into house card
5. ⏭️ Test with various category counts
6. ⏭️ Test tooltip interactions
7. ⏭️ Test responsive behavior

---

**Status**: Ready for implementation pending user approval
**Created**: November 5, 2025
**Version**: 1.0
