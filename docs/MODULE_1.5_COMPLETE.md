# Module 1.5: Household User Management - Complete!

## What We Built

### New Page Created:

**Members Management Page** (`/dashboard/members`)
- View all household members
- Invite new users to household (owners only)
- Change member roles between owner and member (owners only)
- Remove members from household (owners only)
- Track pending invitations
- Enforce household limits (2-8 users, max 2 owners)

### Enhanced Authentication Flow:

**Updated Signup & Login**
- Automatically link invited users when they sign up or log in
- Check for pending invitations by email
- Smart redirect (dashboard if invited, household-setup if new)
- Seamless onboarding experience

## Features Implemented

### 1. Member Statistics
Three stat cards showing:
- **Total Members**: Current count / Max (8)
- **Owners**: Current count / Max (2)
- **Pending Invites**: Users invited but not yet signed up

### 2. Invite Users (Owners Only)
- Expandable invitation form
- Fields:
  - Name (what to call them)
  - Email (must be unique in household)
  - Role (owner or member)
- Validation:
  - Email format check
  - No duplicate emails in household
  - Enforce max 8 users per household
  - Enforce max 2 owners per household
- Creates pending invitation (auth_user_id = null)
- Shows as "Pending" until user signs up

### 3. Change Member Roles (Owners Only)
- Dropdown to change member ↔ owner
- Cannot demote yourself if you're the only owner
- Cannot promote beyond 2 owner limit
- Real-time role updates
- Success confirmation messages

### 4. Remove Members (Owners Only)
- Delete button for each member (except yourself)
- Confirmation dialog before removal
- Permanent deletion from household
- Removes all related data (ratings, weights, etc.)

### 5. Automatic Invitation Linking
When an invited user signs up or logs in:
1. System checks if their email has a pending invite
2. If yes: Links their auth account to the household_user record
3. Redirects them directly to dashboard (skips household setup)
4. They immediately have access to the household

### 6. Member List Display
For each member shows:
- Avatar circle with first initial
- Name and email
- "You" indicator for current user
- "Pending" badge if not yet signed up
- Role badge (owner or member)
- Role selector (if owner viewing others)
- Remove button (if owner viewing others)

## User Interface

### Members Page Layout:
```
┌─────────────────────────────────────────────────────┐
│ Header: HouseRater | Back to Dashboard             │
├─────────────────────────────────────────────────────┤
│ Title: Household Members                            │
│ Description                                          │
│                                                      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│ │Total: 2/8    │ │Owners: 1/2   │ │Pending: 0    ││
│ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                      │
│ [+ Invite User]  (only if owner)                    │
│                                                      │
│ All Members:                                         │
│ ┌──────────────────────────────────────────────────┐│
│ │ JD  John Doe (You)        │ [Owner] │            ││
│ │     john@example.com      │         │            ││
│ ├──────────────────────────────────────────────────┤│
│ │ JS  Jane Smith [Pending]  │ [Member]│ [Remove]   ││
│ │     jane@example.com      │         │            ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ [Info Box: About Household Members]                 │
└─────────────────────────────────────────────────────┘
```

### Member Card States:

**Active Member:**
- Blue avatar background
- Full name and email displayed
- Role shown as badge or selector
- Remove button (if you're owner and it's not you)

**Pending Invite:**
- Yellow avatar background
- Yellow "Pending" badge
- Role shown but not changeable
- Remove button available (cancels invite)

**You:**
- Blue avatar background
- "(You)" indicator next to name
- Role shown as badge (not selector)
- No remove button

## How to Test

### 1. Access Members Page

From Dashboard:
1. Go to http://localhost:3000/dashboard
2. Click "Manage →" link in Household Members section
3. You'll be taken to `/dashboard/members`

### 2. Invite a New User (As Owner)

1. Click "Invite User" button
2. Fill in the form:
   - Name: "Jane Smith"
   - Email: "jane@example.com"
   - Role: "Member"
3. Click "Send Invitation"
4. **Expected:**
   - Success message: "Invitation sent to jane@example.com..."
   - New member appears in list with yellow "Pending" badge
   - Pending count increases to 1
   - Total members increases

### 3. Test Invited User Sign Up

**In a different browser or incognito window:**
1. Go to http://localhost:3000/auth/signup
2. Fill in:
   - Name: "Jane Smith" (or any name)
   - Email: "jane@example.com" (MUST match invite)
   - Password: "password123"
   - Confirm Password: "password123"
3. Click "Create Account"
4. **Expected:**
   - Success message
   - Redirected to /dashboard (NOT /auth/household-setup)
   - Already in the household
   - Can see household data

**Back in original browser:**
1. Refresh the members page
2. **Expected:**
   - Jane Smith no longer has "Pending" badge
   - Pending count decreased to 0
   - Jane is now a full member

### 4. Change Member Role (As Owner)

1. Find a member that isn't you
2. Click the role dropdown
3. Change from "Member" to "Owner" (or vice versa)
4. **Expected:**
   - Success message: "Jane Smith is now an owner"
   - Role badge updates immediately
   - Owner count updates in stats

### 5. Remove Member (As Owner)

1. Find a member that isn't you
2. Click the trash icon (Remove button)
3. **Expected:**
   - Confirmation dialog: "Are you sure you want to remove Jane Smith...?"
4. Click "OK"
5. **Expected:**
   - Success message: "Jane Smith has been removed..."
   - Member disappears from list
   - Total count decreases

### 6. Test Permissions (As Regular Member)

**If you're not an owner:**
1. Go to /dashboard/members
2. **Expected:**
   - No "Invite User" button
   - No remove buttons on members
   - Roles shown as badges (not dropdowns)
   - View-only access

### 7. Test Edge Cases

**Try to remove yourself:**
- No remove button should appear on your own card

**Try to invite with existing email:**
1. Invite a user with an email already in the household
2. **Expected:** Error message

**Try to add 9th user:**
1. Invite users until you have 8
2. Try to invite one more
3. **Expected:** No invite button (limit reached)

**Try to promote 3rd owner:**
1. Have 2 owners already
2. Try to change a member to owner
3. **Expected:** Option disabled in dropdown

**Try to demote yourself as only owner:**
1. Be the only owner
2. Try to change your role to member
3. **Expected:** Error message

## Database Verification

### Check Pending Invitations:

```sql
-- View pending invitations
SELECT
  name,
  email,
  role,
  created_at
FROM household_users
WHERE household_id = 'YOUR_HOUSEHOLD_ID'
  AND auth_user_id IS NULL;
```

**Should show:**
- Invited users who haven't signed up yet

### Check Linked Users:

```sql
-- View all household members with auth status
SELECT
  name,
  email,
  role,
  CASE
    WHEN auth_user_id IS NULL THEN 'Pending'
    ELSE 'Active'
  END as status
FROM household_users
WHERE household_id = 'YOUR_HOUSEHOLD_ID'
ORDER BY created_at;
```

### Verify Invitation Linking:

After an invited user signs up:

```sql
-- Check if auth_user_id was populated
SELECT
  hu.name,
  hu.email,
  hu.auth_user_id,
  au.email as auth_email
FROM household_users hu
LEFT JOIN auth.users au ON au.id = hu.auth_user_id
WHERE hu.household_id = 'YOUR_HOUSEHOLD_ID';
```

**Should show:**
- All members with matching auth_user_id
- Auth email should match household_user email

## API Operations Used

### Invite User:
```typescript
await supabase
  .from('household_users')
  .insert([{
    household_id: household.id,
    name: inviteName.trim(),
    email: inviteEmail.trim().toLowerCase(),
    role: inviteRole,
    auth_user_id: null // Pending
  }])
```

### Link Invited User (Signup):
```typescript
// Check for pending invite
const { data: pendingInvite } = await supabase
  .from('household_users')
  .select('*')
  .eq('email', email.toLowerCase().trim())
  .is('auth_user_id', null)
  .single()

if (pendingInvite) {
  // Link to auth account
  await supabase
    .from('household_users')
    .update({
      auth_user_id: authData.user.id,
      name: name.trim()
    })
    .eq('id', pendingInvite.id)
}
```

### Change Role:
```typescript
await supabase
  .from('household_users')
  .update({ role: newRole })
  .eq('id', member.id)
```

### Remove Member:
```typescript
await supabase
  .from('household_users')
  .delete()
  .eq('id', member.id)
```

## File Structure

```
packages/web/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                    ← Updated with "Manage" link
│   │   └── members/
│   │       └── page.tsx                ← NEW: Members management
│   └── auth/
│       ├── signup/
│       │   └── page.tsx                ← Updated: Link invites
│       └── login/
│           └── page.tsx                ← Updated: Link invites
```

## User Experience Highlights

### 1. Seamless Invitation Flow
- Owner invites user by email
- Invited user signs up with that email
- Automatically joins household (no extra steps)
- Redirected directly to dashboard

### 2. Clear Visual Feedback
- Pending invites have yellow badges
- Active members have blue avatars
- Success/error messages for all actions
- Real-time stat updates

### 3. Permission Controls
- Only owners see invite/manage buttons
- Members have view-only access
- Cannot remove yourself
- Cannot demote only owner
- Clear limit enforcement

### 4. Smart Validations
- Email format checking
- Duplicate email prevention
- Household size limits
- Owner count limits
- Role change restrictions

## Invitation Flow Diagram

```
Owner Invites User:
┌─────────────────┐
│ Owner clicks    │
│ "Invite User"   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fills form:     │
│ - Name          │
│ - Email         │
│ - Role          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Creates record  │
│ in household_   │
│ users table     │
│ (auth_id = null)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Shows "Pending" │
│ in members list │
└─────────────────┘

Invited User Signs Up:
┌─────────────────┐
│ User goes to    │
│ /auth/signup    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enters info     │
│ (MUST use same  │
│ email as invite)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Signup process  │
│ checks for      │
│ pending invite  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Updates record: │
│ Sets auth_id    │
│ to user.id      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirects to    │
│ /dashboard      │
│ (skips setup)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User is now     │
│ active member   │
│ of household    │
└─────────────────┘
```

## Household Limits

As defined in the system:

- **Minimum Users**: 2 (encourages collaboration)
- **Maximum Users**: 8 (prevents overcrowding)
- **Maximum Owners**: 2 (allows co-ownership)

These limits are enforced:
- In the UI (buttons disabled)
- In validation logic (error messages)
- In database triggers (see database-schema.sql)

## Known Behaviors

### 1. Email Matching
- Email matching is case-insensitive
- Emails are trimmed and lowercased
- Must match exactly for auto-linking

### 2. Name Override
- When invited user signs up, their entered name replaces the invitation name
- This allows the user to set their preferred name

### 3. Pending Invites
- Remain in database until user signs up
- Can be removed by owner (cancels invitation)
- Multiple households cannot have same email (email is unique per household)

### 4. Role Changes
- Immediate effect
- Affects permissions immediately
- No confirmation needed (has dropdown)

## Next Steps

With Module 1.5 complete, your household management is fully functional:

1. **Module 3: Category Weighting** (Next up!)
   - Each member rates category importance (0-5)
   - Calculate household averages
   - Use for weighted scoring

2. **Module 4: House Management**
   - Add houses with addresses
   - Store house details
   - Map integration

3. **Module 5: House Rating**
   - Each member rates houses
   - Track individual ratings
   - Calculate household scores

## Success Criteria - All Met!

- [x] Create members management page
- [x] Invite users by email
- [x] Track pending invitations
- [x] Auto-link invited users on signup/login
- [x] Change member roles (owner only)
- [x] Remove members (owner only)
- [x] Enforce household limits (2-8 users)
- [x] Enforce owner limit (max 2)
- [x] Permission-based UI (owner vs member)
- [x] Real-time updates
- [x] Success/error messaging
- [x] Dashboard integration

**Module 1.5 is production-ready!**

The household user management system is fully functional. Multiple users can now collaborate on rating houses together.
