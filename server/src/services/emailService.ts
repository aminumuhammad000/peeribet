import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Peeribet';
const FROM_EMAIL = process.env.SMTP_USER || 'noreply@peeribet.com';

// ─── Shared HTML Wrapper ─────────────────────────────────────────────────────
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Peeribet</title>
</head>
<body style="margin:0;padding:0;background:#0A1124;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1124;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2744,#0d1b36);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                <span style="color:#3B82F6;">Peeri</span>bet
              </h1>
              <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Peer-to-peer trading platform</p>
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
            <td style="background:#0d1b36;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} Peeribet. All rights reserved.</p>
              <p style="margin:6px 0 0;color:#475569;font-size:11px;">Please do not reply to this email.</p>
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
  const transporter = createTransporter();
  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Verify Your Email Address</h2>
    <p style="color:#94A3B8;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${firstName}</strong>, welcome to Peeribet! 
      Use the code below to verify your email address. It expires in <strong style="color:#3B82F6;">10 minutes</strong>.
    </p>
    <div style="background:#0A1124;border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your OTP Code</p>
      <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#3B82F6;">${otp}</div>
    </div>
    <p style="color:#64748B;font-size:13px;margin:0;line-height:1.6;">
      If you didn't create a Peeribet account, you can safely ignore this email.
    </p>
  `);

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `${otp} is your Peeribet verification code`,
    html,
  });
};

// ─── 2. Welcome Email (after OTP verified) ───────────────────────────────────
export const sendWelcomeEmail = async (email: string, firstName: string) => {
  const transporter = createTransporter();
  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Welcome to Peeribet! 🎉</h2>
    <p style="color:#94A3B8;font-size:15px;margin:0 0 24px;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${firstName}</strong>, your account has been verified and you're all set!
    </p>
    <div style="background:#0A1124;border-radius:12px;padding:24px;margin:0 0 28px;">
      <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 12px;">What you can do on Peeribet:</p>
      <ul style="color:#94A3B8;font-size:14px;margin:0;padding-left:20px;line-height:2;">
        <li>Trade securely with peers</li>
        <li>Fund your wallet via bank transfer</li>
        <li>Track your trade history in real time</li>
        <li>Set up escrow-protected outcomes</li>
      </ul>
    </div>
    <div style="text-align:center;">
      <a href="#" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">Open App</a>
    </div>
  `);

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to Peeribet, ${firstName}! 🎉`,
    html,
  });
};

// ─── 3. Password Reset OTP Email ─────────────────────────────────────────────
export const sendPasswordResetEmail = async (email: string, firstName: string, otp: string) => {
  const transporter = createTransporter();
  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Password Reset Request</h2>
    <p style="color:#94A3B8;font-size:15px;margin:0 0 28px;line-height:1.6;">
      Hi <strong style="color:#ffffff;">${firstName}</strong>, we received a request to reset your Peeribet password.
      Use the code below — it expires in <strong style="color:#3B82F6;">10 minutes</strong>.
    </p>
    <div style="background:#0A1124;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:28px;text-align:center;margin:0 0 28px;">
      <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Reset Code</p>
      <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#EF4444;">${otp}</div>
    </div>
    <p style="color:#64748B;font-size:13px;margin:0;line-height:1.6;">
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    </p>
  `);

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `${otp} — Peeribet Password Reset Code`,
    html,
  });
};
