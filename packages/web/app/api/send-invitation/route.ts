import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { inviteeName, inviteeEmail, inviterName, householdName } = await request.json()

    // Validate required fields
    if (!inviteeName || !inviteeEmail || !inviterName || !householdName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const signupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/signup`

    // Email HTML content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${householdName} on HouseRater</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #2563eb; font-size: 32px; font-weight: bold;">HouseRater</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 600;">
                You've been invited!
              </h2>

              <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${inviteeName},
              </p>

              <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join their household "<strong>${householdName}</strong>" on HouseRater.
              </p>

              <p style="margin: 0 0 25px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                HouseRater helps you and your household collaboratively rate and compare houses you're considering. Each member can rate categories like location, size, features, and more to find the perfect home together.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 0 25px 0;">
                <tr>
                  <td style="border-radius: 6px; background-color: #2563eb;">
                    <a href="${signupUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Join ${householdName}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                To accept this invitation, click the button above and sign up using this email address: <strong>${inviteeEmail}</strong>
              </p>

              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Once you sign up, you'll automatically be added to the household and can start rating houses right away!
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${signupUrl}" style="color: #2563eb; text-decoration: underline;">${signupUrl}</a>
              </p>

              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} HouseRater. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const emailText = `
You've been invited to join ${householdName} on HouseRater!

Hi ${inviteeName},

${inviterName} has invited you to join their household "${householdName}" on HouseRater.

HouseRater helps you and your household collaboratively rate and compare houses you're considering. Each member can rate categories like location, size, features, and more to find the perfect home together.

To accept this invitation:
1. Go to ${signupUrl}
2. Sign up using this email address: ${inviteeEmail}
3. You'll automatically be added to the household!

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} HouseRater
    `

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      // Send email using Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'HouseRater <onboarding@resend.dev>',
          to: [inviteeEmail],
          subject: `You're invited to join ${householdName} on HouseRater`,
          html: emailHtml,
          text: emailText
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Resend error:', errorData)
        return NextResponse.json(
          { error: 'Failed to send email', details: errorData },
          { status: 500 }
        )
      }

      const data = await response.json()
      return NextResponse.json({ success: true, emailId: data.id })
    } else {
      // No email service configured - log to console for development
      console.log('='.repeat(80))
      console.log('INVITATION EMAIL (Email service not configured)')
      console.log('='.repeat(80))
      console.log(`To: ${inviteeEmail}`)
      console.log(`Subject: You're invited to join ${householdName} on HouseRater`)
      console.log('-'.repeat(80))
      console.log(emailText)
      console.log('='.repeat(80))

      return NextResponse.json({
        success: true,
        message: 'Email service not configured. Email logged to console.',
        mode: 'development'
      })
    }
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
