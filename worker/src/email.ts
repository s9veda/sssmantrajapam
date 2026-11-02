import type { Env } from './env';

export async function sendOtpEmail(
  env: Env,
  email: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  if (!env.BREVO_API_KEY) {
    console.log('\n📧 ===== EMAIL (Development Mode - Not Sent) =====');
    console.log('To:', email);
    console.log('Code:', code);
    console.log('====================================================\n');
    return { success: true };
  }

  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #FF6200; }
            .content { padding: 30px 20px; }
            .otp-code { text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF6200; background: #FEF3E2; padding: 20px; border-radius: 8px; margin: 30px 0; font-family: 'Courier New', monospace; }
            .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; border-top: 1px solid #E5E7EB; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header"><h1 style="color: #FF6200; margin: 0;">🕉️ Sainam Japam</h1></div>
          <div class="content">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p>Use this code to sign in to Sainam Japam. This code will expire in <strong>10 minutes</strong>.</p>
            <div class="otp-code">${code}</div>
            <div class="warning"><strong>⚠️ Security Notice:</strong> Never share this code with anyone. Sainam Japam staff will never ask for your login code.</div>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} Sainam Japam. All rights reserved.</p></div>
        </body>
      </html>
    `;

    const text = `
Sainam Japam - Your Verification Code

Your verification code is: ${code}

This code will expire in 10 minutes.

⚠️ Security Notice: Never share this code with anyone. Sainam Japam staff will never ask for your login code.

If you didn't request this code, you can safely ignore this email.
    `.trim();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: env.BREVO_SENDER_NAME || 'Sainam Japam',
          email: env.BREVO_SENDER_EMAIL || 'noreply@sainamjapa.local',
        },
        to: [{ email }],
        subject: 'Your Sainam Japam Verification Code',
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      console.error('❌ Brevo API Error:', response.status, await response.text());
      return { success: false, error: 'Failed to send OTP' };
    }
    console.log('✅ Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
}
