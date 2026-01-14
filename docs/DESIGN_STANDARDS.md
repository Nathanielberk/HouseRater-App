# HouseRater Design Standards

## Overview
This document defines the design system and standards for the HouseRater application. It serves as the single source of truth for design decisions, ensuring consistency across the application.

**Last Updated:** January 2026
**Tech Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4
**Design Philosophy:** Clean, accessible, mobile-first, dark mode supported

---

## Table of Contents
1. [Design Tokens](#1-design-tokens)
2. [Typography](#2-typography)
3. [Color System](#3-color-system)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Icons](#6-icons)
7. [Patterns](#7-patterns)
8. [Accessibility](#8-accessibility)
9. [Code Standards](#9-code-standards)
10. [Design Decisions (ADRs)](#10-design-decisions-adrs)

---

## 1. Design Tokens

Design tokens are the foundational values that define visual design. HouseRater uses Tailwind CSS with minimal custom configuration.

### Current Configuration

**File:** `packages/web/tailwind.config.ts`

```typescript
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
```

### CSS Variables

**File:** `packages/web/app/globals.css`

```css
@import "tailwindcss";

body {
  font-family: Arial, Helvetica, sans-serif;
}
```

### Future Enhancement: Design Tokens

Consider migrating to CSS custom properties for better theming:

```css
:root {
  /* Primary Brand */
  --color-primary: theme('colors.blue.600');
  --color-primary-hover: theme('colors.blue.700');
  --color-primary-light: theme('colors.blue.100');

  /* Semantic Colors */
  --color-success: theme('colors.green.600');
  --color-warning: theme('colors.yellow.600');
  --color-error: theme('colors.red.600');

  /* Neutrals */
  --color-text-primary: theme('colors.gray.900');
  --color-text-secondary: theme('colors.gray.600');
  --color-border: theme('colors.gray.200');
  --color-background: theme('colors.white');
}

.dark {
  --color-text-primary: theme('colors.white');
  --color-text-secondary: theme('colors.gray.400');
  --color-border: theme('colors.gray.800');
  --color-background: theme('colors.gray.950');
}
```

---

## 2. Typography

### Font Family

**Primary Font:** System sans-serif stack
```css
font-family: Arial, Helvetica, sans-serif;
```

### Type Scale (Tailwind Classes)

| Use Case | Class | Example |
|----------|-------|---------|
| Page Title | `text-3xl font-bold` | Dashboard headers |
| Section Title | `text-2xl font-semibold` | Card headers |
| Subsection | `text-lg font-semibold` | Quick Actions header |
| Body | `text-sm` or `text-base` | General content |
| Caption | `text-xs` | Timestamps, hints |
| Button | `font-medium` or `font-semibold` | CTAs |

### Text Colors

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Primary text | `text-gray-900` | `dark:text-white` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-500` | `dark:text-gray-400` |
| Brand text | `text-blue-600` | `dark:text-blue-400` |

### Heading Patterns

```tsx
// Page title
<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
  Page Title
</h2>

// Section title
<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
  Section Title
</h3>

// Supporting text
<p className="text-gray-600 dark:text-gray-400">
  Description text goes here
</p>
```

---

## 3. Color System

### Brand Colors

| Color | Tailwind Class | Usage |
|-------|----------------|-------|
| **Primary Blue** | `blue-600` / `blue-400` (dark) | Brand, primary actions, links |
| **Primary Light** | `blue-100` / `blue-900/30` (dark) | Icon backgrounds, highlights |

### Semantic Colors

| Meaning | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| **Success** | `green-600` | `green-400` | Completed states, positive actions |
| **Warning** | `yellow-600` | `yellow-400` | Caution states |
| **Error** | `red-600` | `red-400` | Error states, destructive actions |
| **Info** | `blue-600` | `blue-400` | Informational states |
| **Purple** | `purple-600` | `purple-400` | Categories, owner badge |

### Background Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page background | `bg-white` | `dark:bg-gray-950` |
| Card background | `bg-white` | `dark:bg-gray-900` |
| Subtle background | `bg-gray-50` | `dark:bg-gray-800` |
| Modal backdrop | `bg-black/50` | `bg-black/50` |

### Border Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Default border | `border-gray-200` | `dark:border-gray-800` |
| Input border | `border-gray-300` | `dark:border-gray-700` |
| Hover border | `hover:border-blue-500` | `dark:hover:border-blue-500` |

### Accent Color Patterns by Feature

| Feature | Color | Light Class | Dark Class |
|---------|-------|-------------|------------|
| Household/Users | Blue | `blue-100`, `blue-600` | `blue-900/30`, `blue-400` |
| Houses | Green | `green-100`, `green-600` | `green-900/30`, `green-400` |
| Categories | Purple | `purple-100`, `purple-600` | `purple-900/30`, `purple-400` |
| Priorities | Blue | `blue-100`, `blue-600` | `blue-900/30`, `blue-400` |

### Rating Color Gradient

Used in house rating sliders (0-5 scale):

| Rating | Color | Meaning |
|--------|-------|---------|
| 0 | Red | Poor |
| 1 | Orange | Below Average |
| 2 | Yellow | Average |
| 3 | Lime | Good |
| 4 | Green | Very Good |
| 5 | Emerald | Excellent |

---

## 4. Spacing & Layout

### Spacing Scale

HouseRater uses Tailwind's default spacing scale (4px base):

| Token | Value | Common Usage |
|-------|-------|--------------|
| `1` | 4px | Icon gaps |
| `2` | 8px | Tight spacing |
| `3` | 12px | List item padding |
| `4` | 16px | Card padding (mobile) |
| `6` | 24px | Card padding (desktop) |
| `8` | 32px | Section spacing |

### Page Layout

```tsx
// Standard page container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Page content */}
</div>
```

### Grid Patterns

```tsx
// Stats grid (3 columns on desktop)
<div className="grid md:grid-cols-3 gap-6">

// Action cards (2-3 columns)
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

// Form layout (single column)
<div className="space-y-4">
```

### Responsive Breakpoints

| Breakpoint | Tailwind Prefix | Width | Usage |
|------------|-----------------|-------|-------|
| Mobile | (default) | < 640px | Single column, bottom nav |
| Tablet | `sm:` | 640px+ | Wider containers |
| Desktop | `md:` | 768px+ | Multi-column grids |
| Large | `lg:` | 1024px+ | Sidebar visible, 3-column grids |

### Layout Components

**DashboardShell** - Main layout wrapper
- Desktop: 64-unit (256px) fixed sidebar
- Mobile: Full width with bottom navigation
- Main content: `lg:pl-64 pb-20 lg:pb-0`

---

## 5. Components

### Component Inventory

| Category | Components |
|----------|------------|
| **Navigation** | Sidebar, BottomNav, NavLink |
| **Layout** | DashboardShell |
| **Onboarding** | WelcomeModal, OnboardingChecklist, TourProvider, InviteMembersPrompt, CategorySetupGuide, PrioritiesIntro, AddFirstHousePrompt |
| **Forms** | Input fields (inline), Buttons (inline) |
| **Feedback** | Loading spinner (inline), Error messages (inline) |

### Button Styles

**Primary Button**
```tsx
<button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Primary Action
</button>
```

**Secondary Button**
```tsx
<button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
  Secondary Action
</button>
```

**Link Button**
```tsx
<Link className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
  Link Text →
</Link>
```

**Destructive Button**
```tsx
<button className="text-red-600 hover:text-red-700 dark:text-red-400">
  Delete
</button>
```

### Card Styles

**Standard Card**
```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
  {/* Card content */}
</div>
```

**Interactive Card**
```tsx
<Link className="p-6 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all text-left block">
  {/* Card content */}
</Link>
```

### Input Styles

**Text Input**
```tsx
<input
  type="text"
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
  placeholder="Placeholder text"
/>
```

**Label**
```tsx
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  Field Label
</label>
```

### Modal Styles

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="px-6 pt-8 pb-4 text-center">
      {/* Title */}
    </div>

    {/* Content */}
    <div className="px-6 py-4">
      {/* Body */}
    </div>

    {/* Footer */}
    <div className="px-6 py-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
      {/* Actions */}
    </div>
  </div>
</div>
```

### Loading States

**Spinner**
```tsx
<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
```

**Loading Container**
```tsx
<div className="flex items-center justify-center p-8">
  <div className="text-center">
    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
  </div>
</div>
```

### Badge/Pill Styles

**Role Badge**
```tsx
// Owner
<span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
  owner
</span>

// Member
<span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
  member
</span>
```

### Avatar/Initial Circle

```tsx
<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
  <span className="text-blue-600 dark:text-blue-400 font-semibold">
    {name.charAt(0).toUpperCase()}
  </span>
</div>
```

---

## 6. Icons

### Icon System

HouseRater uses **inline SVG icons** styled with Tailwind classes. No external icon library is currently used.

### Icon Sizing

| Size | Class | Usage |
|------|-------|-------|
| Small | `w-4 h-4` | Inline with text, buttons |
| Medium | `w-5 h-5` | Card headers, list items |
| Default | `w-6 h-6` | Navigation, stat icons |
| Large | `w-8 h-8` | Modal headers, empty states |
| XL | `w-16 h-16` | Page empty states |

### Icon Style

All icons use outline style with consistent stroke properties:
```tsx
<svg
  className="w-6 h-6"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="..."
  />
</svg>
```

### Icon Color

Icons inherit text color via `stroke="currentColor"`. Apply color using text utilities:
```tsx
<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" ...>
```

### Standard Icons Used

| Icon | Usage | Path |
|------|-------|------|
| Home | Dashboard, houses | `M3 12l2-2m0 0l7-7 7 7M5 10v10...` |
| Users | Household, members | `M17 20h5v-2a3 3 0 00-5.356-1.857...` |
| Clipboard | Categories | `M9 5H7a2 2 0 00-2 2v12...` |
| Scale | Priorities/weights | `M3 6l3 1m0 0l-3 9...` |
| Building | Houses list | `M19 21V5a2 2 0 00-2-2H7...` |
| Star | Ratings | `M11.049 2.927c.3-.921...` |
| Question | Help/tour | `M8.228 9c.549-1.165...` |

### Future Enhancement: Icon Library

Consider adopting [Heroicons](https://heroicons.com/) for consistency:
```bash
npm install @heroicons/react
```

```tsx
import { HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

<HomeIcon className="w-6 h-6 text-blue-600" />
```

---

## 7. Patterns

### Navigation Patterns

**Desktop Sidebar**
- Fixed position, 256px width
- Logo + household name at top
- Navigation links with icons
- User profile + actions at bottom

**Mobile Bottom Navigation**
- Fixed to bottom of viewport
- 5 icon-only navigation items
- Active state indicator

### Page Structure Pattern

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Page Header */}
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
      Page Title
    </h2>
    <p className="mt-2 text-gray-600 dark:text-gray-400">
      Page description
    </p>
  </div>

  {/* Page Content */}
  <div className="space-y-8">
    {/* Sections */}
  </div>
</div>
```

### Form Patterns

**Standard Form Layout**
```tsx
<form className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Label
    </label>
    <input className="w-full px-4 py-3 border..." />
  </div>

  <button type="submit" className="w-full py-3 px-4 bg-blue-600...">
    Submit
  </button>
</form>
```

**Error Display**
```tsx
<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
</div>
```

### Empty State Pattern

```tsx
<div className="text-center py-12">
  <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
    {/* Icon */}
  </div>
  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
    No items yet
  </h3>
  <p className="text-gray-600 dark:text-gray-400 mb-4">
    Description of what to do
  </p>
  <button className="...">
    Add First Item
  </button>
</div>
```

### List Item Pattern

```tsx
<div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
  <div className="flex items-center">
    {/* Avatar/Icon */}
    <div className="ml-3">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        Primary text
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Secondary text
      </p>
    </div>
  </div>
  {/* Actions/Badge */}
</div>
```

### Stat Card Pattern

```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
  <div className="flex items-center">
    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
      {/* Icon */}
    </div>
    <div className="ml-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Label</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">Value</p>
    </div>
  </div>
</div>
```

---

## 8. Accessibility

### Compliance Target

**WCAG 2.1 Level AA**

### Color Contrast

| Element | Minimum Ratio |
|---------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+ bold, 24px+) | 3:1 |
| UI components | 3:1 |

### Keyboard Navigation

- All interactive elements must be focusable
- Focus order follows visual order
- Focus indicators must be visible

**Focus Ring Pattern**
```tsx
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
dark:focus:ring-offset-gray-900
```

### Form Accessibility

```tsx
// Labels linked to inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-hint" />
<p id="email-hint">We'll never share your email</p>

// Error states
<input aria-invalid={hasError} aria-describedby="email-error" />
<p id="email-error" role="alert">{errorMessage}</p>
```

### Button Accessibility

```tsx
// Icon-only buttons need labels
<button aria-label="Close dialog">
  <XIcon />
</button>

// Loading states
<button disabled aria-busy="true">
  Loading...
</button>
```

### Modal Accessibility

- Focus trapped within modal when open
- Escape key closes modal
- Focus returns to trigger element on close
- `role="dialog"` and `aria-modal="true"`

### Screen Reader Considerations

- Use semantic HTML (`<nav>`, `<main>`, `<aside>`)
- Provide alt text for images
- Use `aria-live` for dynamic content updates
- Hide decorative elements with `aria-hidden="true"`

---

## 9. Code Standards

### File Structure

```
packages/web/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── navigation/        # Navigation components
│   ├── onboarding/        # Onboarding flow components
│   └── DashboardShell.tsx # Layout wrapper
├── lib/                   # Utilities and helpers
│   ├── supabase/          # Supabase client/server
│   ├── tour/              # Onboarding state management
│   └── types/             # TypeScript types
└── public/                # Static assets
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `WelcomeModal.tsx` |
| Utilities | camelCase | `tourStorage.ts` |
| Types | PascalCase | `OnboardingState` |
| CSS classes | Tailwind utilities | `text-gray-900` |
| Folders | kebab-case | `onboarding/` |

### Component Pattern

```tsx
'use client'  // Only if needed

import { useState } from 'react'

// Props interface (if needed)
interface ComponentProps {
  propName: string
  optionalProp?: number
}

export default function ComponentName({ propName, optionalProp }: ComponentProps) {
  // State
  const [state, setState] = useState()

  // Handlers
  const handleAction = () => {}

  // Render
  return (
    <div className="...">
      {/* Content */}
    </div>
  )
}
```

### Server vs Client Components

| Use Server Components | Use Client Components |
|----------------------|----------------------|
| Data fetching | useState, useEffect |
| Access to backend | Event handlers (onClick) |
| Static content | Browser APIs |
| No interactivity | Real-time updates |

### Tailwind Usage Guidelines

**DO:**
- Use Tailwind utilities directly in JSX
- Group related utilities logically
- Use dark mode variants consistently

**DON'T:**
- Create custom CSS unless absolutely necessary
- Use `@apply` (increases bundle size)
- Mix inline styles with Tailwind

**Class Organization Order:**
1. Layout (display, position)
2. Sizing (width, height)
3. Spacing (margin, padding)
4. Typography (font, text)
5. Visual (background, border)
6. Interactive (hover, focus)
7. Dark mode variants

```tsx
// Good
<div className="flex items-center gap-4 p-4 text-sm bg-white border rounded-lg hover:shadow-md dark:bg-gray-900">

// Avoid
<div className="hover:shadow-md text-sm dark:bg-gray-900 p-4 flex bg-white border gap-4 items-center rounded-lg">
```

### Dark Mode Pattern

Always pair light mode classes with dark mode variants:
```tsx
// Colors
text-gray-900 dark:text-white
text-gray-600 dark:text-gray-400
bg-white dark:bg-gray-900
border-gray-200 dark:border-gray-800

// Semi-transparent backgrounds
bg-blue-100 dark:bg-blue-900/30
```

---

## 10. Design Decisions (ADRs)

### ADR-001: Tailwind CSS Over Component Library

**Status:** Accepted

**Context:**
Need to choose a styling approach for the application.

**Decision:**
Use Tailwind CSS with custom utility compositions rather than a pre-built component library (e.g., shadcn/ui, Chakra UI).

**Consequences:**
- Good: Full control over styling, smaller bundle size, no dependency updates
- Good: Consistent with Next.js ecosystem
- Bad: More verbose JSX, patterns must be manually maintained
- Bad: No pre-built accessible components

---

### ADR-002: Inline SVG Icons

**Status:** Accepted

**Context:**
Need icons throughout the application.

**Decision:**
Use inline SVG icons with Tailwind styling rather than an icon library.

**Consequences:**
- Good: Zero additional dependencies
- Good: Full styling control with Tailwind
- Bad: Verbose JSX for each icon
- Bad: Icons not centralized (potential inconsistency)

**Future Consideration:**
May migrate to Heroicons when component library is needed.

---

### ADR-003: System Font Stack

**Status:** Accepted

**Context:**
Need to select typography for the application.

**Decision:**
Use system sans-serif fonts (Arial, Helvetica) rather than custom web fonts.

**Consequences:**
- Good: Zero font loading, instant rendering
- Good: Familiar, readable on all devices
- Bad: Less brand differentiation
- Bad: Slight variation across platforms

---

### ADR-004: Dark Mode via Tailwind Classes

**Status:** Accepted

**Context:**
Application should support dark mode.

**Decision:**
Implement dark mode using Tailwind's `dark:` variant classes, detected via system preference.

**Consequences:**
- Good: Automatic system preference detection
- Good: No JavaScript for theme switching
- Bad: Every color must be specified twice
- Bad: No user toggle (follows system only)

---

### ADR-005: Client-Side State for Onboarding

**Status:** Accepted

**Context:**
Need to persist onboarding progress across sessions.

**Decision:**
Store onboarding state in localStorage, keyed by user ID.

**Consequences:**
- Good: No additional database tables
- Good: Works offline
- Good: Multi-account support on same device
- Bad: Lost if user clears browser data
- Bad: Not synced across devices

---

### ADR-006: No Component Library (Yet)

**Status:** Accepted

**Context:**
Deciding whether to use shadcn/ui or build custom components.

**Decision:**
Build custom components using Tailwind patterns for MVP, evaluate shadcn/ui for v2.

**Consequences:**
- Good: Faster initial development, no learning curve
- Good: Exact control over component behavior
- Bad: Reinventing patterns (modals, forms)
- Bad: Accessibility must be manually implemented

---

## 11. Audit Findings & Inconsistencies

**Last Audit:** January 2026

### Inconsistencies Found

#### Typography Inconsistencies

| Location | Issue | Standard | Actual |
|----------|-------|----------|--------|
| `categories/page.tsx` | Page title size | `text-3xl` | `text-2xl` |
| `weights/page.tsx` | Page title size | `text-3xl` | `text-2xl` |
| `houses/page.tsx` | Page title size | `text-3xl` | `text-2xl` |
| `categories/page.tsx` | Has duplicate description | Single description | Two descriptions |

**Recommendation:** Standardize all page titles to use `text-2xl` (current pattern) and update design standard to match.

#### Container Width Inconsistencies

| Location | Issue | Common Pattern | Actual |
|----------|-------|----------------|--------|
| `dashboard/page.tsx` | Container max-width | Varies | `max-w-7xl` |
| `weights/page.tsx` | Container max-width | Varies | `max-w-4xl` |
| `houses/page.tsx` | Container max-width | Varies | `max-w-7xl` |
| `categories/page.tsx` | Container max-width | Varies | `max-w-7xl` |

**Recommendation:** Document that content-dense pages use `max-w-4xl` while list/grid pages use `max-w-7xl`.

#### Button Variant Inconsistencies

| Location | Issue | Standard | Actual |
|----------|-------|----------|--------|
| `houses/page.tsx` | Add button | `bg-blue-600` | `bg-blue-600 dark:bg-blue-500` |
| `categories/page.tsx` | Add button | `bg-blue-600` | `bg-blue-600` (no dark override) |

**Recommendation:** Remove `dark:bg-blue-500` override - `bg-blue-600` works in both modes.

#### Success/Error Message Inconsistencies

| Location | Success Background | Error Background |
|----------|-------------------|------------------|
| `categories/page.tsx` | `bg-green-50 dark:bg-green-900/30` | `bg-red-50 dark:bg-red-900/30` |
| `weights/page.tsx` | N/A | `bg-red-50 dark:bg-red-900/30` |
| `signup/page.tsx` | N/A | `bg-red-50 dark:bg-red-900/20` |

**Issue:** Inconsistent opacity in dark mode (`/30` vs `/20`)
**Recommendation:** Standardize to `dark:bg-{color}-900/20` for all feedback messages.

### Missing from Design Standards

#### 1. Select/Dropdown Styles
Found in `categories/page.tsx` but not documented:
```tsx
<select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
```

#### 2. Toggle Button Styles
Found in `houses/page.tsx` - archive toggle:
```tsx
<button className={`px-4 py-2 rounded-lg border-2 transition-colors ${
  isActive
    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
}`}>
```

#### 3. Slider/Range Input Styles
Found in `weights/page.tsx` - complex slider styling not documented:
```tsx
<input type="range" className="w-full h-3 rounded-lg appearance-none cursor-pointer
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:w-6
  [&::-webkit-slider-thumb]:h-6
  ..." />
```

#### 4. Progress Bar Styles
Found in `OnboardingChecklist.tsx`:
```tsx
<div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
  <div className="h-full bg-blue-600 rounded-full transition-all duration-300" />
</div>
```

#### 5. Inline Saving Indicator
Found in `weights/page.tsx`:
```tsx
<span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
  <svg className="animate-spin h-4 w-4 mr-2">...</svg>
  Saving...
</span>
```

#### 6. Category Card States
Found in `categories/page.tsx` - active/inactive category styling:
```tsx
category.is_active
  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
```

#### 7. Weight Color Gradient
Found in `weights/page.tsx` - 6-level gradient (different from rating gradient):
- 0: Black/very dark (`bg-gray-900`)
- 1: Dark gray (`bg-gray-700`)
- 2: Medium gray (`bg-gray-500`)
- 3: Light gray with cool tone (`bg-slate-400`)
- 4: Cool teal green (`bg-teal-500`)
- 5: Cool modern green (`bg-emerald-600`)

#### 8. Score Color Gradient (Houses)
Found in `houses/page.tsx` - percentage-based colors:
- 90%+: Emerald (`rgb(16, 185, 129)`)
- 75%+: Green (`rgb(34, 197, 94)`)
- 60%+: Lime (`rgb(132, 204, 22)`)
- 45%+: Yellow (`rgb(234, 179, 8)`)
- 30%+: Orange (`rgb(249, 115, 22)`)
- <30%: Red (`rgb(239, 68, 68)`)

#### 9. Chiclet/Heatmap Visualization
Found in `houses/page.tsx` - compact category visualization using inline styles.

#### 10. Info Box Styles
Found in multiple pages - standardized info box pattern:
```tsx
<div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
  <div className="flex">
    <div className="flex-shrink-0">{/* Icon */}</div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Title</h3>
      <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
        {/* Content */}
      </div>
    </div>
  </div>
</div>
```

#### 11. Collapsible Section Pattern
Found in `weights/page.tsx` - accordion-style group headers with progress bars.

#### 12. Emoji Usage
Found in `houses/page.tsx` - emoji used for property stats:
- 🛏️ Bedrooms
- 🛁 Bathrooms
- 📏 Square footage

**Note:** This violates the design standard that says "Only use emojis if user explicitly requests."
**Recommendation:** Replace with SVG icons for consistency.

### Code Quality Issues

#### 1. Missing Closing Tags
`categories/page.tsx` line 235 has unclosed `<div>` tag before stats grid.

#### 2. Inconsistent Padding Values
- Some pages use `py-6`, others use `py-8`
- Should standardize to `py-8` for consistency

#### 3. Inconsistent Button Padding
- Primary buttons: `px-4 py-3` (auth pages)
- Other buttons: `px-4 py-2` (dashboard pages)

### Recommended Updates

1. **Add missing component documentation** for Select, Toggle, Slider, Progress Bar
2. **Standardize feedback message opacity** to `/20` in dark mode
3. **Replace emojis** with SVG icons in houses page
4. **Document weight and score color gradients** separately from rating gradient
5. **Add collapsible section pattern** to patterns section
6. **Clarify page container widths** (`max-w-4xl` vs `max-w-7xl`)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| Jan 2026 | 1.0 | Initial design standards document |
| Jan 2026 | 1.1 | Added audit findings section with inconsistencies and missing items |

---

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3](https://m3.material.io/)
- [Shopify Polaris](https://polaris.shopify.com/)
