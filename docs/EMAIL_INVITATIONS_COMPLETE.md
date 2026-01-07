# Email Invitations - Complete!

## What Was Added

The invitation system now sends **actual email invitations** to users when household owners invite them.

### New Features:

1. **API Route for Sending Emails**
   - Created `/api/send-invitation` endpoint
   - Sends beautifully formatted HTML emails
   - Includes plain text fallback
   - Professional email template

2. **Email Integration**
   - Members page now calls the email API when inviting
   - Non-blocking: invitation works even if email fails
   - Success message confirms email was sent

3. **Development Mode**
   - Emails logged to console when no API key configured
   - No setup required for development
   - See full email content in terminal

4. **Production Ready**
   - Supports Resend API (recommended)
   - Can be adapted for SendGrid, Mailgun, AWS SES
   - Environment variable configuration

## Email Template

The invitation email includes:

- **HouseRater branding** with blue color scheme
- **Personalized greeting** with invitee's name
- **Inviter's name** and **household name**
- **Clear call-to-action** button: "Join [Household Name]"
- **Instructions** on how to accept (sign up with email)
- **Explanation** of what HouseRater does
- **Professional footer** with timestamp
- **Plain text version** for email clients without HTML support

## How It Works

### Invitation Flow with Email:

```
1. Owner invites user
   ↓
2. System creates pending invitation in database
   ↓
3. API route sends email to invitee
   ↓
4. Invitee receives email with signup link
   ↓
5. Invitee clicks "Join [Household]" button
   ↓
6. Redirected to signup page
   ↓
7. Signs up with the invited email
   ↓
8. Automatically added to household
   ↓
9. Redirected to dashboard (ready to use!)
```

## Files Created/Modified

### New Files:
- [app/api/send-invitation/route.ts](../packages/web/app/api/send-invitation/route.ts) - Email sending API
- [docs/EMAIL_SETUP.md](EMAIL_SETUP.md) - Complete setup guide

### Modified Files:
- [app/dashboard/members/page.tsx](../packages/web/app/dashboard/members/page.tsx) - Calls email API

## Current Mode: Development (No Setup Required)

Right now, the app is in **development mode**:

- ✅ Invitations work perfectly
- ✅ Users are added to household
- ✅ No email service needed
- ✅ Email content logged to console
- ⚠️ Actual emails are NOT sent
- ⚠️ You need to manually tell invitees to sign up

**To see emails in development:**
1. Run `npm run dev` in terminal
2. Invite a user from http://localhost:3000/dashboard/members
3. Check your terminal for the email output

Example console output:
```
================================================================================
INVITATION EMAIL (Email service not configured)
================================================================================
To: jane@example.com
Subject: You're invited to join Smith Family on HouseRater
--------------------------------------------------------------------------------

You've been invited to join Smith Family on HouseRater!

Hi Jane Smith,

John Doe has invited you to join their household "Smith Family" on HouseRater.

HouseRater helps you and your household collaboratively rate and compare houses...

To accept this invitation:
1. Go to http://localhost:3000/auth/signup
2. Sign up using this email address: jane@example.com
3. You'll automatically be added to the household!
...
================================================================================
```

## Enabling Real Emails (Optional)

To send **actual emails** in production:

### Quick Setup (5 minutes):

1. **Sign up for Resend** (free):
   - Go to https://resend.com/
   - Create account (no credit card required)
   - Get API key from dashboard

2. **Add to .env.local**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=HouseRater <onboarding@resend.dev>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

4. **Test**: Invite a real email address you can check

That's it! See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed instructions.

## Testing the Feature

### Test 1: Development Mode (No Email Service)

1. Run the dev server: `npm run dev`
2. Go to http://localhost:3000/dashboard/members
3. Click "Invite User"
4. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Role: "Member"
5. Click "Send Invitation"
6. **Check terminal** - you'll see the full email
7. **Check members list** - user shows as "Pending"

### Test 2: With Email Service (If Configured)

1. Set up Resend API key (see EMAIL_SETUP.md)
2. Restart server
3. Invite a **real email you can access**
4. Check that email inbox
5. **Expected**: Professional invitation email received
6. Click "Join [Household]" button
7. Sign up with the invited email
8. **Expected**: Automatically in household

## Email Deliverability

### Development (resend.dev):
- ✅ Instant delivery
- ✅ No spam filtering
- ⚠️ Limited to Resend test domain
- ⚠️ May show "via resend.dev" in email

### Production (Custom Domain):
- ✅ Better deliverability
- ✅ Professional branding
- ✅ No "via" warnings
- ⚠️ Requires DNS setup

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for custom domain setup.

## Error Handling

The system is designed to be **resilient**:

- **Email fails**: Invitation still created, owner gets success message
- **No API key**: Falls back to console logging
- **Network error**: Invitation works, email skipped
- **Invalid email**: Caught by validation before sending

**User experience**: Invitations always work, emails are a bonus!

## API Endpoint Details

### Request:
```typescript
POST /api/send-invitation
Content-Type: application/json

{
  "inviteeName": "Jane Smith",
  "inviteeEmail": "jane@example.com",
  "inviterName": "John Doe",
  "householdName": "Smith Family"
}
```

### Response (Success):
```json
{
  "success": true,
  "emailId": "abc123"
}
```

### Response (Development Mode):
```json
{
  "success": true,
  "message": "Email service not configured. Email logged to console.",
  "mode": "development"
}
```

### Response (Error):
```json
{
  "error": "Failed to send email",
  "details": "..."
}
```

## Environment Variables

### Required for Production:
```env
RESEND_API_KEY=re_...           # Get from https://resend.com
EMAIL_FROM=HouseRater <your@email.com>
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

### Optional (already set):
```env
NEXT_PUBLIC_SUPABASE_URL=...    # Already configured
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # Already configured
```

## Cost

### Resend Free Tier:
- **3,000 emails/month** - free forever
- **100 emails/day** - rate limit
- **No credit card required**

For most users, this is more than enough!

### When You'd Need More:
- 100+ active households
- Frequent re-invitations
- High user churn

**Paid plan**: $20/month for 50,000 emails

## Future Enhancements

Potential improvements (not yet implemented):

1. **Resend invitation**: Button to resend email to pending users
2. **Email templates**: Multiple templates for different occasions
3. **Email preferences**: Let users opt out of emails
4. **Email tracking**: See if emails were opened/clicked
5. **Batch invitations**: Invite multiple users at once
6. **Copy invitation link**: Manual sharing option

## Security Considerations

✅ **Email validation**: Format checked before sending
✅ **Rate limiting**: Resend enforces 100/day limit
✅ **No sensitive data**: Emails don't contain passwords or tokens
✅ **API key security**: Stored in environment variables (never committed)
✅ **Server-side only**: Email API key never exposed to client

## Success Criteria - All Met!

- [x] Create email sending API route
- [x] Design professional email template
- [x] Integrate with invitation flow
- [x] Add error handling
- [x] Support development mode (console logging)
- [x] Support production mode (real emails)
- [x] Documentation for setup
- [x] Non-blocking (invitations work without email)

**Email invitations are production-ready!**

## Summary

Invitations now send beautiful, professional emails to invitees:
- **Development**: Emails logged to console (no setup)
- **Production**: Real emails via Resend (5-minute setup)
- **Resilient**: Works even if email fails
- **Professional**: Branded HTML template
- **Easy**: One API key to enable

The feature is complete and ready to use!
