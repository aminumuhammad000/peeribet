import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import nodemailer from 'nodemailer';
import { getFromName, getFromEmail, sanitizeEmailText } from '../services/emailService';

async function main() {
  console.log('\n==================================================');
  console.log('       PEERITRADE EMAIL CONFIGURATION CHECK       ');
  console.log('==================================================\n');

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const fromName = getFromName();
  const fromEmail = getFromEmail();

  console.log('Configuration detected in server/.env:');
  console.log(`  - SMTP_HOST:       ${host}`);
  console.log(`  - SMTP_PORT:       ${port}`);
  console.log(`  - SMTP_USER:       ${user ? user : '[EMPTY / NOT CONFIGURED]'}`);
  console.log(`  - SMTP_PASS:       ${pass ? '******** (configured)' : '[EMPTY / NOT CONFIGURED]'}`);
  console.log(`  - EMAIL_FROM_NAME: ${fromName}`);
  console.log(`  - EMAIL_FROM:      ${fromEmail}`);
  console.log('--------------------------------------------------\n');

  if (!user || !pass) {
    console.log('❌ STATUS: Email sending is NOT active (Credentials missing).');
    console.log('\nDetails:');
    console.log('  Both `SMTP_USER` and `SMTP_PASS` must be set in `server/.env`.');
    console.log('  Currently, the application runs in development fallback mode:');
    console.log('  -> OTP verification codes and password reset codes are printed to the server console.');
    console.log('  -> No actual emails are sent to users.\n');
    console.log('To enable actual email delivery:');
    console.log('  1. If using Gmail:');
    console.log('     - Enable 2-Step Verification on your Google account.');
    console.log('     - Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.log('     - Set in server/.env:');
    console.log('         SMTP_HOST=smtp.gmail.com');
    console.log('         SMTP_PORT=587');
    console.log('         SMTP_USER=your-account@gmail.com');
    console.log('         SMTP_PASS=your-16-char-app-password');
    console.log('         EMAIL_FROM=your-account@gmail.com');
    console.log('         EMAIL_FROM_NAME=Peeritrade');
    console.log('  2. If using custom SMTP (SendGrid, Mailgun, Resend, AWS SES):');
    console.log('     - Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM accordingly.\n');
    return;
  }

  console.log('Verifying SMTP connection and credentials with the mail server...');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Connection & Authentication Successful!\n');

    // Check if recipient specified via command line arguments: --to user@example.com
    const args = process.argv.slice(2);
    const toIndex = args.indexOf('--to');
    const recipient = toIndex !== -1 && args[toIndex + 1] ? args[toIndex + 1] : null;

    if (recipient) {
      console.log(`Sending a test email to ${recipient}...`);
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        subject: sanitizeEmailText(`${testOtp} is your Peeritrade test verification code`),
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Peeritrade</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0;padding:40px 16px;background-color:#ffffff;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;text-align:left;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#09090b;">Peeritrade</span>
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:24px;color:#27272a;">
              <p style="margin:0 0 16px;">This is a test email to verify your email configuration.</p>
              <div style="background-color:#f4f4f5;border-radius:8px;padding:18px 24px;text-align:center;margin:0 0 24px;">
                <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#09090b;">${testOtp}</span>
              </div>
              <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">Email delivery is working properly.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;margin-top:32px;border-top:1px solid #e4e4e7;font-size:12px;line-height:18px;color:#71717a;">
              <p style="margin:0;">© ${new Date().getFullYear()} Peeritrade. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        replyTo: fromEmail,
      });
      console.log(`✅ Test email successfully delivered to ${recipient}!\n`);
    } else {
      console.log('💡 Tip: You can send a test email by running:');
      console.log('  npm run test:email -- --to your-email@example.com\n');
    }
  } catch (error: any) {
    console.error('❌ SMTP Verification Failed:');
    console.error(`  Error: ${error.message}\n`);
    if (error.code === 'EAUTH') {
      console.error('  Hint: Authentication failed. Please check your username and app password.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('  Hint: Connection timed out or was refused. Check your host and port settings or firewall.');
    }
  }
}

main().catch((err) => {
  console.error('Unexpected script error:', err);
  process.exit(1);
});
