import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';

// ─── Helper: generate OTP ────────────────────────────────────────────────────
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// ─── Register ────────────────────────────────────────────────────────────────
// @route  POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({ firstName, lastName, email, phone, password, otp, otpExpires });

    if (user) {
      // Generate default username if not provided
      const defaultUsername = email.split('@')[0] + Math.floor(1000 + Math.random() * 9000);
      user.username = defaultUsername;
      await user.save();

      // Send OTP email (non-blocking)
      sendOtpEmail(email, firstName, otp).catch((err) =>
        console.error('[Email] Failed to send OTP email:', err.message)
      );

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
// @route  POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        role: user.role,
        balance: user.balance,
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
// @route  POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp === otp && user.otpExpires && user.otpExpires > new Date()) {
      const wasAlreadyVerified = user.isVerified;
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Send welcome email only on first verification
      if (!wasAlreadyVerified) {
        sendWelcomeEmail(email, user.firstName).catch((err) =>
          console.error('[Email] Failed to send welcome email:', err.message)
        );
      }

      res.status(200).json({
        message: 'Email verified successfully',
        token: generateToken((user._id as any).toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Resend OTP ──────────────────────────────────────────────────────────────
// @route  POST /api/auth/resend-otp
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendOtpEmail(email, user.firstName, otp).catch((err) =>
      console.error('[Email] Failed to resend OTP email:', err.message)
    );

    res.json({ message: 'OTP resent successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
// @route  POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always respond with 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail(email, user.firstName, otp).catch((err) =>
      console.error('[Email] Failed to send reset email:', err.message)
    );

    res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
// @route  POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword; // pre-save hook will hash it
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
// ─── Update Profile ──────────────────────────────────────────────────────────
// @route  PUT /api/auth/profile
export const updateProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { firstName, lastName, username } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    if (username) {
      // Check if username is already taken by someone else
      const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username.toLowerCase();
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Upload Profile Image ────────────────────────────────────────────────────
// @route  POST /api/auth/profile/image
export const uploadProfileImage = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profileImage = req.file.path; // Cloudinary URL
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      profileImage: user.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
