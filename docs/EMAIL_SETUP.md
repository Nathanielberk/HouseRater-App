# Email Invitation Setup Guide

The HouseRater app now sends invitation emails when household owners invite new members. This guide explains how to configure email sending.

## Development Mode (Default)

By default, **no email service is configured**. In development mode:

- Invitation emails are logged to the **server console** instead of being sent
- You'll see the full email content in your terminal
- The invitation still works - users just won't receive an actual email
- You need to manually tell invitees to sign up

**To see invitation emails in development:**
1. Run `npm run dev` in the terminal
2. Invite a user from `/dashboard/members`
3. Check the terminal output for the email content

Example console output:
```
================================================================================
INVITATION EMAIL (Email service not configured)
================================================================================
To: jane@example.com
Subject: You're invited to join Smith Family on HouseRater
--------------------------------------------------------------------------------
You've been invited to join Smith Family on HouseRater!
...
================================================================================
```

## Production Setup with Resend (Recommended)

[Resend](https://resend.com/) is a modern email API that's easy to set up and has a generous free tier.

### Why Resend?
- **Free tier**: 3,000 emails/month, 100 emails/day
- **Simple API**: Easy to integrate
- **No credit card required** for free tier
- **Good deliverability**: Built by email experts
- **Custom domains**: Use your own domain for professional emails

### Step 1: Create Resend Account

1. Go to https://resend.com/
2. Click "Start Building" or "Sign Up"
3. Sign up with your email or GitHub account
4. Verify your email address

### Step 2: Get API Key

1. After logging in, go to **API Keys** in the dashboard
2. Click "Create API Key"
3. Name it: "HouseRater Production" (or any name)
4. Select permissions: **Sending access**
5. Click "Create"
6. **Copy the API key** (starts with `re_...`)
   - ⚠️ Important: This is shown only once!

### Step 3: Add API Key to Your App

1. Open your `.env.local` file in `packages/web/`
2. Add the Resend API key:

```env
# Existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add these new lines:
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=HouseRater <onboarding@resend.dev>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Save the file
4. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Start it again
   npm run dev
   ```

### Step 4: Test Email Sending

1. Go to http://localhost:3000/dashboard/members
2. Click "Invite User"
3. Fill in the form with a **real email address you can check**
4. Click "Send Invitation"
5. Check the email inbox - you should receive the invitation!

### Step 5: Using a Custom Domain (Optional)

To send emails from your own domain (e.g., `invites@yourdomain.com`):

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter your domain name
4. Add the DNS records Resend provides to your domain registrar
5. Wait for verification (usually a few minutes)
6. Update `.env.local`:
   ```env
   EMAIL_FROM=HouseRater <invites@yourdomain.com>
   ```

## Alternative: Other Email Services

While Resend is recommended, you can use other services by modifying the API route.

### Option 1: SendGrid

```typescript
// In app/api/send-invitation/route.ts
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: inviteeEmail }] }],
    from: { email: process.env.EMAIL_FROM || 'no-reply@yourdomain.com' },
    subject: `You're invited to join ${householdName} on HouseRater`,
    content: [
      { type: 'text/plain', value: emailText },
      { type: 'text/html', value: emailHtml }
    ]
  })
})
```

### Option 2: Mailgun

```typescript
// In app/api/send-invitation/route.ts
const formData = new FormData()
formData.append('from', process.env.EMAIL_FROM || 'no-reply@yourdomain.com')
formData.append('to', inviteeEmail)
formData.append('subject', `You're invited to join ${householdName} on HouseRater`)
formData.append('text', emailText)
formData.append('html', emailHtml)

const response = await fetch(
  `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
    },
    body: formData
  }
)
```

### Option 3: AWS SES

Requires `@aws-sdk/client-ses` package. More complex setup but very scalable.

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform:
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)

### Vercel:
1. Go to your project → Settings → Environment Variables
2. Add each variable
3. Redeploy your app

### Netlify:
1. Go to Site settings → Environment variables
2. Add each variable
3. Redeploy your app

## Email Template Customization

The invitation email is defined in [app/api/send-invitation/route.ts](../packages/web/app/api/send-invitation/route.ts).

To customize:
1. Open the file
2. Find the `emailHtml` variable
3. Modify the HTML/styling
4. Test by sending an invitation

The email includes:
- HouseRater branding
- Inviter's name
- Household name
- Sign-up button with link
- Plain text fallback
- Professional styling

## Troubleshooting

### Email not received?

**Check spam/junk folder**: First-time senders often land in spam

**Verify API key**: Make sure you copied the full key including `re_` prefix

**Check logs**: Look at server console for error messages

**Test with Resend dashboard**:
- Go to Resend → Emails
- See recent sends and their status

### "Email service not configured" message?

**API key not set**: Check that `RESEND_API_KEY` is in `.env.local`

**Server not restarted**: Restart the dev server after adding env variables

**Wrong .env file**: Make sure you're editing `packages/web/.env.local`, not root `.env.local`

### Emails going to spam?

**Use custom domain**: Emails from your own domain have better deliverability

**Authenticate domain**: Add SPF, DKIM records (Resend provides these)

**Avoid spam triggers**: Don't use ALL CAPS, excessive exclamation marks

## Cost Estimates

### Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- Perfect for small to medium households

**When you'll hit limits:**
- 100 households × 30 invites/month = 3,000 emails/month ✅
- Large-scale use will need paid plan

### Resend Paid Plans
- **Pro**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

For most HouseRater users, free tier is sufficient.

## Current Implementation Status

✅ API route created
✅ Email HTML template designed
✅ Integration with members page
✅ Development mode (console logging)
✅ Production ready (with API key)
✅ Error handling (invitation works even if email fails)

## Next Steps

1. **For development**: Current setup works - emails logged to console
2. **For production**: Sign up for Resend and add API key
3. **Optional**: Set up custom domain for branded emails

The invitation system works with or without email - users just need to know to sign up!
