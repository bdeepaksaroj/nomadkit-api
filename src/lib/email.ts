import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendOTPEmail(to: string, otp: string, name: string) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Your NomadKit verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e8401c;">NomadKit</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="letter-spacing: 8px; color: #333; font-size: 36px;">${otp}</h1>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, ignore this email.</p>
        <p>— The NomadKit Team</p>
      </div>
    `,
  }

  await sgMail.send(msg)
}

export async function sendWelcomeEmail(to: string, name: string) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Welcome to NomadKit!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e8401c;">Welcome to NomadKit!</h2>
        <p>Hi ${name},</p>
        <p>Your account is verified and ready. You now have access to:</p>
        <ul>
          <li>Emergency contacts for 194 countries</li>
          <li>Local food guides</li>
          <li>Scam alerts</li>
          <li>Transport guides</li>
          <li>Live currency converter</li>
          <li>Travel groups</li>
        </ul>
        <p>Start exploring at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
        <p>— The NomadKit Team</p>
      </div>
    `,
  }

  await sgMail.send(msg)
}