import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
    });
  }

  // Default to standard Gmail service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
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
  return 'noreply@peeritrade.com';
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
<body style="margin:0;padding:0;background:#0A1124;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1124;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#131C32,#0A1124);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,210,133,0.2);">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:#00D285;">Peeri</span>trade
              </h1>
              <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Peer-to-Peer Escrow Trading Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0A1124;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} Peeritrade. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#475569;font-size:11px;">Institutional Escrow & Outcome Verification</p>
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
    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Verify Your Email Address</h2>
      <p style="color:#94A3B8;font-size:15px;margin:0 0 28px;line-height:1.6;">
        Hi <strong style="color:#ffffff;">${firstName}</strong>, welcome to Peeritrade! 
        Use the verification code below to activate your trading terminal account. It expires in <strong style="color:#00D285;">10 minutes</strong>.
      </p>
      <div style="background:#0A1124;border:1px solid rgba(0,210,133,0.35);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#00D285;">${otp}</div>
      </div>
      <p style="color:#64748B;font-size:13px;margin:0;line-height:1.6;">
        If you didn't create a Peeritrade account, you can safely ignore this email.
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
    console.log(`[Development Fallback] Verification OTP for ${email}: ${otp}`);
  }
};

// ─── 2. Welcome Email (after OTP verified) ───────────────────────────────────
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  try {
    const transporter = createTransporter();
    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Welcome to Peeritrade! 🎉</h2>
      <p style="color:#94A3B8;font-size:15px;margin:0 0 24px;line-height:1.6;">
        Hi <strong style="color:#ffffff;">${firstName}</strong>, your trading account is verified and ready!
      </p>
      <div style="background:#0A1124;border-radius:12px;padding:24px;margin:0 0 28px;border:1px solid rgba(255,255,255,0.06);">
        <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 12px;">Getting Started on Peeritrade:</p>
        <ul style="color:#94A3B8;font-size:14px;margin:0;padding-left:20px;line-height:2;">
          <li>Trade sport outcomes directly peer-to-peer</li>
          <li>Instant escrow funding and automated payouts</li>
          <li>Invest in live football club share indices</li>
          <li>Zero bookmaker margins and transparent execution</li>
        </ul>
      </div>
    `));

    const subject = sanitizeEmailText(`Welcome to Peeritrade, ${firstName}! 🎉`);

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
    const fromName = getFromName();
    const fromEmail = getFromEmail();

    const html = sanitizeEmailText(emailWrapper(`
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Password Reset Request</h2>
      <p style="color:#94A3B8;font-size:15px;margin:0 0 28px;line-height:1.6;">
        Hi <strong style="color:#ffffff;">${firstName}</strong>, we received a request to reset your Peeritrade password.
        Use the code below — it expires in <strong style="color:#00D285;">10 minutes</strong>.
      </p>
      <div style="background:#0A1124;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
        <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Reset Code</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#EF4444;">${otp}</div>
      </div>
      <p style="color:#64748B;font-size:13px;margin:0;line-height:1.6;">
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    `));

    const subject = sanitizeEmailText(`${otp} — Peeritrade Password Reset Code`);

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
    console.log(`[Development Fallback] Password Reset OTP for ${email}: ${otp}`);
  }
};
