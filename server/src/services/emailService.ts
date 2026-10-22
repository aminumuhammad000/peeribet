import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (user && pass) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: { user, pass },
        connectionTimeout: 10000,
      });
    }

    // Default to standard Gmail service
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
    });
  }

  return null;
};

// ─── Sender Helpers & Sanitizers ─────────────────────────────────────────────
export const getFromName = (): string => {
  const envName = process.env.EMAIL_FROM_NAME?.trim();
  if (envName && !/peeribet/i.test(envName)) {
    return envName;
  }
  return 'Peeritrade';
};

export const getFromEmail = (): string => {
  const customFrom = (process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS)?.trim();
  if (customFrom && !/peeribet/i.test(customFrom)) {
    return customFrom;
  }
  const smtpUser = process.env.SMTP_USER?.trim();
  if (smtpUser && !/peeribet/i.test(smtpUser)) {
    return smtpUser;
  }
  return 'support@peeritrade.com';
};

export const sanitizeEmailText = (text: string): string => {
  return text.replace(/peeribet/gi, (match) => {
    if (match === 'PEERIBET') return 'PEERITRADE';
    if (match === 'Peeribet') return 'Peeritrade';
    return 'peeritrade';
  });
};

// ─── Shared HTML Wrapper ─────────────────────────────────────────────────────
const emailWrapper = (content: string) => `
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
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#09090b;">Peeritrade</span>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="font-size:15px;line-height:24px;color:#27272a;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;margin-top:32px;border-top:1px solid #e4e4e7;font-size:12px;line-height:18px;color:#71717a;">
              <p style="margin:0;">© ${new Date().getFullYear()} Peeritrade. All rights reserved.</p>
              <p style="margin:4px 0 0;">Need help? Contact <a href="mailto:support@peeritrade.com" style="color:#09090b;text-decoration:underline;">support@peeritrade.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── 1. OTP Verification Email ───────────────────────────────────────────────
export const sendOtpEmail = async (email: string, firstName: string, otp: string) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n══════════════════════════════════════════════════════════════`);
      console.log(`[EmailService - No SMTP Configured in server/.env]`);
      console.log(`  To: ${email} (${firstName})`);
      console.log(`  Type: Email Verification OTP`);
      console.log(`  OTP Code: ${otp}`);
      console.log(`  (Configure SMTP_USER and SMTP_PASS in server/.env for email delivery)`);
      console.log(`══════════════════════════════════════════════════════════════\n`);
      return;
    }

    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <p style="margin:0 0 16px;font-size:15px;color:#27272a;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:24px;">
        Use the verification code below to verify your email address. This code expires in <strong>10 minutes</strong>.
      </p>
      <div style="background-color:#f4f4f5;border-radius:8px;padding:18px 24px;text-align:center;margin:0 0 24px;">
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#09090b;">
          ${otp}
        </span>
      </div>
      <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
        If you didn't create a Peeritrade account, you can safely ignore this email. Never share this code with anyone.
      </p>
    `));

    const subject = sanitizeEmailText(`${otp} is your Peeritrade verification code`);

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject,
      html,
      replyTo: fromEmail,
    });
    console.log(`[EmailService] OTP sent successfully to ${email}`);
  } catch (error: any) {
    console.error(`[EmailService Error] Failed to send OTP to ${email}:`, error.message);
    console.log(`\n[Fallback] Verification OTP for ${email}: ${otp}\n`);
  }
};

// ─── 2. Welcome Email (after OTP verified) ───────────────────────────────────
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return;

    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <p style="margin:0 0 16px;font-size:15px;color:#27272a;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:24px;">
        Welcome to Peeritrade. Your account has been verified and is ready to use.
      </p>
      <div style="border-left:2px solid #00D285;padding-left:16px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:14px;color:#27272a;font-weight:600;">What you can do next:</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#52525b;line-height:22px;">
          <li>Fund your account and explore active sports markets</li>
          <li>Trade sports outcomes directly peer-to-peer</li>
          <li>Enjoy automated escrow and transparent settlement</li>
        </ul>
      </div>
      <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
        If you have any questions or need help, simply reach out to us at <a href="mailto:support@peeritrade.com" style="color:#09090b;text-decoration:underline;">support@peeritrade.com</a>.
      </p>
    `));

    const subject = sanitizeEmailText(`Welcome to Peeritrade, ${firstName}`);

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject,
      html,
      replyTo: fromEmail,
    });
    console.log(`[EmailService] Welcome email sent to ${email}`);
  } catch (error: any) {
    console.error(`[EmailService Error] Failed to send welcome email to ${email}:`, error.message);
  }
};

// ─── 3. Password Reset OTP Email ─────────────────────────────────────────────
export const sendPasswordResetEmail = async (email: string, firstName: string, otp: string) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n══════════════════════════════════════════════════════════════`);
      console.log(`[EmailService - No SMTP Configured in server/.env]`);
      console.log(`  To: ${email} (${firstName})`);
      console.log(`  Type: Password Reset OTP`);
      console.log(`  Reset Code: ${otp}`);
      console.log(`  (Configure SMTP_USER and SMTP_PASS in server/.env for email delivery)`);
      console.log(`══════════════════════════════════════════════════════════════\n`);
      return;
    }

    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <p style="margin:0 0 16px;font-size:15px;color:#27272a;">
        Hi <strong>${firstName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:24px;">
        We received a request to reset your Peeritrade password. Use the verification code below — it expires in <strong>10 minutes</strong>:
      </p>
      <div style="background-color:#f4f4f5;border-radius:8px;padding:18px 24px;text-align:center;margin:0 0 24px;">
        <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#09090b;">
          ${otp}
        </span>
      </div>
      <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
        If you did not request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    `));

    const subject = sanitizeEmailText(`${otp} is your Peeritrade password reset code`);

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject,
      html,
      replyTo: fromEmail,
    });
    console.log(`[EmailService] Password reset OTP sent to ${email}`);
  } catch (error: any) {
    console.error(`[EmailService Error] Failed to send password reset OTP to ${email}:`, error.message);
    console.log(`\n[Fallback] Password Reset OTP for ${email}: ${otp}\n`);
  }
};
