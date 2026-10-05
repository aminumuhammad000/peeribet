import { Request, Response } from 'express';
import User from '../models/User';
import Referral from '../models/Referral';
import SystemSetting from '../models/SystemSetting';
import Transaction from '../models/Transaction';
import { generateToken } from '../utils/generateToken';
import { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';
import { createNotification } from '../services/notificationService';
import { generateUniqueReferralCode } from './referralController';

// ─── Helper: generate OTP ────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ────────────────────────────────────────────────────────────────
// @route  POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password, referralCode } = req.body;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanReferralCode = referralCode ? String(referralCode).trim().toUpperCase() : '';

    if (!cleanEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userExists = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    if (userExists) {
      if (userExists.email === cleanEmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Check optional referral code
    let referrerUser: any = null;
    if (cleanReferralCode) {
      referrerUser = await User.findOne({ referralCode: cleanReferralCode });
    }

    // Fetch referral system settings
    const settings = await SystemSetting.findOne();
    const isReferralActive = settings?.referralEnabled ?? true;
    const refereeBonus = (referrerUser && isReferralActive) ? (settings?.refereeBonus ?? 1000) : 0;
    const referrerBonus = (referrerUser && isReferralActive) ? (settings?.referrerBonus ?? 1000) : 0;

    const myReferralCode = await generateUniqueReferralCode(firstName);

    const user = await User.create({
      firstName,
      lastName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      isVerified: true,
      referralCode: myReferralCode,
      referredBy: referrerUser ? referrerUser._id : undefined,
      balance: refereeBonus, // Credit welcome bonus immediately if registered with code
    });

    if (user) {
      const token = generateToken((user._id as any).toString());

      // If registered with valid referral code, credit bonus and record transactions
      if (referrerUser && isReferralActive && refereeBonus > 0) {
        // Record transaction for new referee
        await Transaction.create({
          user: user._id,
          type: 'referral_bonus',
          amount: refereeBonus,
          status: 'completed',
          reference: `REF-WELCOME-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          description: `Referral welcome bonus for joining with code ${cleanReferralCode}`,
        });

        // Record notification for new referee
        createNotification(
          (user._id as any).toString(),
          'Welcome Bonus Credited! 🎁',
          `You received ₦${refereeBonus.toLocaleString()} welcome bonus for signing up with referral code ${cleanReferralCode}!`,
          'system'
        ).catch(() => {});

        // Credit referrer user
        if (referrerBonus > 0) {
          referrerUser.balance = (referrerUser.balance || 0) + referrerBonus;
          referrerUser.referralEarnings = (referrerUser.referralEarnings || 0) + referrerBonus;
          referrerUser.referralCount = (referrerUser.referralCount || 0) + 1;
          await referrerUser.save();

          await Transaction.create({
            user: referrerUser._id,
            type: 'referral_bonus',
            amount: referrerBonus,
            status: 'completed',
            reference: `REF-BONUS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            description: `Referral reward from friend ${firstName} ${lastName}`,
          });

          createNotification(
            (referrerUser._id as any).toString(),
            'Referral Reward Received! 🎁',
            `Your friend ${firstName} joined Peeritrade using your referral code! ₦${referrerBonus.toLocaleString()} has been credited to your balance.`,
            'system'
          ).catch(() => {});
        }

        // Record Referral relationship
        await Referral.create({
          referrer: referrerUser._id,
          referee: user._id,
          referralCode: cleanReferralCode,
          referrerBonus,
          refereeBonus,
          status: 'rewarded',
          rewardedAt: new Date(),
        });
      }

      sendWelcomeEmail(cleanEmail, firstName).catch((err) =>
        console.error('[Email] Failed to send welcome email:', err.message)
      );

      createNotification(
        (user._id as any).toString(),
        'Welcome to Peeritrade! 🎉',
        'Your account has been created. Start exploring live markets, fund your wallet, or create outcome orders.',
        'system'
      ).catch(() => {});

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referralCode,
        token,
        message: 'Account created successfully!',
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
    const rawIdentifier = req.body.emailOrPhone || req.body.email || req.body.username || req.body.phone;
    const cleanIdentifier = rawIdentifier ? String(rawIdentifier).trim() : '';
    const cleanPassword = req.body.password ? String(req.body.password) : '';

    if (!cleanIdentifier || !cleanPassword) {
      return res.status(400).json({ message: 'Email, username, or phone and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { username: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(cleanPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanOtp = otp ? String(otp).trim() : '';

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOtpValid =
      String(user.otp || '').trim() === cleanOtp &&
      user.otpExpires &&
      new Date(user.otpExpires).getTime() > Date.now();

    if (isOtpValid) {
      const wasAlreadyVerified = user.isVerified;
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();

      // Send welcome email & notification only on first verification
      if (!wasAlreadyVerified) {
        sendWelcomeEmail(cleanEmail, user.firstName).catch((err) =>
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    if (!cleanEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: cleanEmail });
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

    sendOtpEmail(cleanEmail, user.firstName, otp).catch((err) =>
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
    const cleanPhone = phone ? String(phone).trim() : undefined;
    let query = {};
    if (cleanEmail) query = { email: cleanEmail };
    else if (cleanPhone) query = { phone: cleanPhone };
    else return res.status(400).json({ message: 'Email or phone is required' });

    const user = await User.findOne(query);
    if (user) {
      return res.status(400).json({ 
        available: false, 
        message: `${cleanEmail ? 'Email' : 'Phone number'} is already registered` 
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    if (!cleanEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    // Always respond with 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset code has been sent.' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendPasswordResetEmail(cleanEmail, user.firstName, otp).catch((err) =>
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanOtp = otp ? String(otp).trim() : '';

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Email and reset code are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOtpValid =
      String(user.otp || '').trim() === cleanOtp &&
      user.otpExpires &&
      new Date(user.otpExpires).getTime() > Date.now();

    if (!isOtpValid) {
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
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanOtp = otp ? String(otp).trim() : '';

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOtpValid =
      String(user.otp || '').trim() === cleanOtp &&
      user.otpExpires &&
      new Date(user.otpExpires).getTime() > Date.now();

    if (isOtpValid) {
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

