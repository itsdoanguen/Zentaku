export const emailVerificationTemplate = (userName: string, verificationUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Verify Your Email - MyAniList</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="background-color: #2563eb; padding: 32px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">MyAniList</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify your email address</h2>
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Thanks for signing up! Please verify your email address by clicking the button below. This link will expire in <strong>24 hours</strong>.</p>
          <div style="text-align: center; margin: 36px 0;">
            <a href="${verificationUrl}"
               style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 13px; word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #64748b;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">© ${new Date().getFullYear()} MyAniList. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
