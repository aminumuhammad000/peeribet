import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';
import { createNotification } from '../services/notificationService';

// ─── Helper: generate OTP ────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
      sendOtpEmail(email, firstName, otp).catch((err) =>
        console.error('[Email] Failed to send registration OTP email:', err.message)
      );

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        message: 'Account created! Please check your email for verification OTP.',
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
    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Re-issue OTP if unverified
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      sendOtpEmail(user.email, user.firstName, otp).catch((err) =>
        console.error('[Email] Failed to send login verification OTP email:', err.message)
      );

      return res.status(403).json({
        message: 'Account not verified. A new OTP has been sent to your email.',
        unverified: true,
        email: user.email,
      });
    }

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken((user._id as any).toString()),
    });
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

      // Send welcome email & notification only on first verification
      if (!wasAlreadyVerified) {
        sendWelcomeEmail(email, user.firstName).catch((err) =>
          console.error('[Email] Failed to send welcome email:', err.message)
        );
        createNotification(
          (user._id as any).toString(),
          'Welcome to Peeritrade! 🎉',
          'Your account is verified. Start exploring live markets, fund your wallet, or create outcome orders.',
          'system'
        ).catch(() => {});
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

// ─── Check Availability ──────────────────────────────────────────────────────
// @route  POST /api/auth/check-availability
export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;
    let query = {};
    if (email) query = { email };
    else if (phone) query = { phone };
    else return res.status(400).json({ message: 'Email or phone is required' });

    const user = await User.findOne(query);
    if (user) {
      return res.status(400).json({ 
        available: false, 
        message: `${email ? 'Email' : 'Phone number'} is already registered` 
      });
    }

    res.json({ available: true });
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

    createNotification(
      (user._id as any).toString(),
      'Password Reset Successful 🔒',
      'Your account password was reset successfully.',
      'system'
    ).catch(() => {});

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Check Reset OTP (without deleting it) ───────────────────────────────────
// @route  POST /api/auth/verify-reset-otp
export const checkResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp === otp && user.otpExpires && user.otpExpires > new Date()) {
      res.status(200).json({ message: 'OTP is valid' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
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

    let imageUrl = req.file.path;
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      const serverBase = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      imageUrl = `${serverBase}/uploads/${req.file.filename}`;
    }

    user.profileImage = imageUrl;
    await user.save();

    res.json({
      message: 'Profile image updated successfully',
      profileImage: user.profileImage,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Upload KYC Document ─────────────────────────────────────────────────────
// @route  POST /api/auth/profile/kyc
export const uploadKycDocument = async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let docUrl = req.file.path;
    if (!docUrl.startsWith('http://') && !docUrl.startsWith('https://')) {
      const serverBase = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
      docUrl = `${serverBase}/uploads/${req.file.filename}`;
    }

    user.kycDocument = docUrl;
    user.kycStatus = 'pending';
    await user.save();

    createNotification(
      (user._id as any).toString(),
      'KYC Documents Submitted 📋',
      'Your identity documents have been uploaded and are under review by compliance.',
      'system'
    ).catch(() => {});

    res.json({
      message: 'KYC Document uploaded successfully',
      kycStatus: user.kycStatus,
      kycDocument: user.kycDocument,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update PIN ──────────────────────────────────────────────────────────────
// @route  PUT /api/auth/profile/pin
export const updatePin = async (req: any, res: Response) => {
  try {
    const { currentPin, newPin } = req.body;
    
    if (!newPin || newPin.length !== 4) {
      return res.status(400).json({ message: 'New PIN must be exactly 4 digits' });
    }

    const user = await User.findById(req.user._id).select('+pin');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If user already has a PIN, verify currentPin
    if (user.pin) {
      if (!currentPin) {
        return res.status(400).json({ message: 'Current PIN is required' });
      }
      const isMatch = await user.comparePin(currentPin);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current PIN is incorrect' });
      }
    }

    user.pin = newPin;
    await user.save();

    createNotification(
      (user._id as any).toString(),
      'Transaction PIN Updated 🛡️',
      'Your 4-digit transaction PIN has been successfully set.',
      'system'
    ).catch(() => {});

    res.json({ message: 'PIN updated successfully', hasPin: true });
  } catch (error: any) {
    console.error('Update PIN error:', error);
    res.status(500).json({ message: error.message || 'Internal server error while updating PIN' });
  }
};

// ─── Change Password ─────────────────────────────────────────────────────────
// @route  PUT /api/auth/profile/password
export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    // Explicitly select password to ensure it's available for comparison
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    createNotification(
      (user._id as any).toString(),
      'Password Changed 🔒',
      'Your trading account password was changed successfully.',
      'system'
    ).catch(() => {});

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message || 'Internal server error while changing password' });
  }
};

// ─── Update Push Token ───────────────────────────────────────────────────────
// @route  POST /api/auth/profile/push-token
export const updatePushToken = async (req: any, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Push token is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pushToken = token;
    await user.save();

    res.json({ message: 'Push token updated successfully' });
  } catch (error: any) {
    console.error('Update push token error:', error);
    res.status(500).json({ message: error.message || 'Failed to update push token' });
  }
};

