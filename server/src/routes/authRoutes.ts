import express, { Response } from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  checkResetOtp,
  updateProfile,
  uploadProfileImage,
  checkAvailability,
  uploadKycDocument,
  updatePin,
  changePassword,
  updatePushToken,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { upload } from '../config/cloudinary';
import User from '../models/User';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/check-availability', checkAvailability);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', checkResetOtp);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);
router.post('/profile/kyc', protect, upload.single('document'), uploadKycDocument);
router.put('/profile/pin', protect, updatePin);
router.put('/profile/password', protect, changePassword);
router.post('/profile/push-token', protect, updatePushToken);
router.get('/me', protect, async (req: any, res: Response) => {
  // Fetch user again to include pin (since it's select: false)
  let user = await User.findById(req.user._id).select('+pin');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  if (!user.referralCode) {
    const { generateUniqueReferralCode } = await import('../controllers/referralController');
    user.referralCode = await generateUniqueReferralCode(user.firstName);
    await user.save();
  }

  const userObj = { ...user.toJSON(), hasPin: !!user.pin } as Record<string, any>;
  delete userObj.pin; // Ensure pin is never sent to the client
  res.json(userObj);
});

router.get('/leaderboard', protect, async (req: any, res: Response) => {
  try {
    const timeframe = req.query.timeframe || 'season';
    const users = await User.find({ role: 'user' })
      .sort({ balance: -1 })
      .limit(30)
      .select('firstName lastName username profileImage balance referralCount createdAt');

    const currentUserId = req.user._id.toString();
    const TIERS = ['Diamond Whale 💎', 'Grandmaster 👑', 'Master Trader ⚡', 'Alpha Scalper 🎯', 'Pro Trader 🔥'];

    const leaderboard = users.map((u, idx) => {
      const pseudoWinRate = Math.min(94, Math.max(62, 88 - idx * 1.2 + (u.balance % 7))).toFixed(0);
      const pseudoTradesCount = Math.max(12, Math.round((u.balance || 50000) / 12000) + 15);
      const tier = idx === 0 ? 'Grand Champion 🥇' : idx === 1 ? 'Diamond Elite 🥈' : idx === 2 ? 'Master Trader 🥉' : TIERS[idx % TIERS.length];
      const estimatedPrize = idx === 0 ? 1000000 : idx === 1 ? 500000 : idx === 2 ? 250000 : idx < 10 ? 50000 : 10000;

      return {
        _id: u._id,
        rank: idx + 1,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username || `trader_${u._id.toString().slice(-4)}`,
        profileImage: u.profileImage,
        balance: u.balance,
        seasonProfit: u.balance > 10000 ? u.balance - 5000 : u.balance,
        winRate: `${pseudoWinRate}%`,
        tradesCount: pseudoTradesCount,
        tier,
        prize: estimatedPrize,
        isCurrentUser: u._id.toString() === currentUserId,
      };
    });

    let currentUserEntry = leaderboard.find((l) => l.isCurrentUser);
    if (!currentUserEntry) {
      const user = await User.findById(req.user._id);
      currentUserEntry = {
        _id: req.user._id,
        rank: Math.min(users.length + 1, 14),
        firstName: user?.firstName || 'You',
        lastName: user?.lastName || '',
        username: user?.username || 'you',
        profileImage: user?.profileImage,
        balance: user?.balance || 0,
        seasonProfit: (user?.balance || 0) > 5000 ? (user?.balance || 0) - 5000 : 12000,
        winRate: '72%',
        tradesCount: 18,
        tier: 'Alpha Scalper 🎯',
        prize: 50000,
        isCurrentUser: true,
      };
    }

    res.json({
      seasonName: 'Season 4: European League & Q4 Macro',
      totalPrizePool: 2500000,
      endsInDays: 4,
      endsInHours: 12,
      leaderboard,
      currentUser: currentUserEntry,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
