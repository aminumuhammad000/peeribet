import { Request, Response } from 'express';
import User from '../models/User';
import Referral from '../models/Referral';
import WinReceiptShare from '../models/WinReceiptShare';
import SystemSetting from '../models/SystemSetting';
import Transaction from '../models/Transaction';
import { createNotification } from '../services/notificationService';

// Helper to generate unique referral code
export const generateUniqueReferralCode = async (firstName: string = 'PEE'): Promise<string> => {
  const prefix = (firstName.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'PEE').toUpperCase();
  for (let i = 0; i < 15; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const candidate = `${prefix}${randomSuffix}`;
    const exists = await User.findOne({ referralCode: candidate });
    if (!exists) return candidate;
  }
  return `REF${Date.now().toString(36).slice(-5).toUpperCase()}`;
};

// ─── Validate Referral Code ──────────────────────────────────────────────────
// @route  GET /api/referrals/validate/:code
export const validateReferralCode = async (req: Request, res: Response) => {
  try {
    const rawCode = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Referral code is required' });
    }

    const settings = await SystemSetting.findOne();
    if (settings && settings.referralEnabled === false) {
      return res.status(400).json({ valid: false, message: 'Referral program is currently paused' });
    }

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) {
      return res.status(404).json({ valid: false, message: 'Invalid referral code' });
    }

    const refereeBonus = settings?.refereeBonus ?? 1000;
    const referrerBonus = settings?.referrerBonus ?? 1000;

    res.json({
      valid: true,
      code,
      referrerName: `${referrer.firstName} ${referrer.lastName.charAt(0)}.`,
      bonus: refereeBonus,
      referrerBonus,
      message: `Valid code! You will receive ₦${refereeBonus.toLocaleString()} welcome bonus upon joining.`
    });
  } catch (error: any) {
    res.status(500).json({ valid: false, message: error.message });
  }
};

// ─── Get My Referral Overview & History ──────────────────────────────────────
// @route  GET /api/referrals/my-referrals
export const getMyReferrals = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-generate code if user doesn't have one yet
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode(user.firstName);
      await user.save();
    }

    const settings = await SystemSetting.findOne();
    const referrerBonus = settings?.referrerBonus ?? 1000;
    const refereeBonus = settings?.refereeBonus ?? 1000;
    const isProgramActive = settings?.referralEnabled ?? true;

    // Fetch user's referrals list
    const referrals = await Referral.find({ referrer: userId })
      .populate('referee', 'firstName lastName username email createdAt')
      .sort({ createdAt: -1 })
      .limit(100);

    const totalEarned = user.referralEarnings ?? 
      referrals.reduce((sum, r) => sum + (r.referrerBonus || 0), 0);
    const totalCount = user.referralCount ?? referrals.length;

    res.json({
      referralCode: user.referralCode,
      totalEarned,
      totalCount,
      referrerBonus,
      refereeBonus,
      isProgramActive,
      programDescription: settings?.referralDescription || 'Invite friends and both of you earn ₦1,000 cash bonus!',
      referrals: referrals.map((r: any) => ({
        _id: r._id,
        refereeName: r.referee ? `${r.referee.firstName} ${r.referee.lastName}` : 'Anonymous Trader',
        bonus: r.referrerBonus,
        status: r.status,
        date: r.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin: Get Referral Analytics & Ledger ──────────────────────────────────
// @route  GET /api/admin/referrals/stats
export const getAdminReferralStats = async (req: Request, res: Response) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    
    // Aggregation for total bonuses paid
    const bonusAgg = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferrerBonus: { $sum: '$referrerBonus' },
          totalRefereeBonus: { $sum: '$refereeBonus' },
        }
      }
    ]);

    const totalReferrerBonus = bonusAgg[0]?.totalReferrerBonus || 0;
    const totalRefereeBonus = bonusAgg[0]?.totalRefereeBonus || 0;
    const totalBonusPaid = totalReferrerBonus + totalRefereeBonus;

    // Top Referrers
    const topReferrers = await User.find({ referralCount: { $gt: 0 } })
      .select('firstName lastName email referralCode referralCount referralEarnings')
      .sort({ referralCount: -1 })
      .limit(10);

    // Recent 50 Referrals Activity
    const recentReferrals = await Referral.find()
      .populate('referrer', 'firstName lastName email referralCode')
      .populate('referee', 'firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .limit(100);

    const settings = await SystemSetting.findOne();

    res.json({
      totalReferrals,
      totalBonusPaid,
      totalReferrerBonus,
      totalRefereeBonus,
      activeReferrersCount: topReferrers.length,
      topReferrers,
      recentReferrals,
      settings: {
        referralEnabled: settings?.referralEnabled ?? true,
        referrerBonus: settings?.referrerBonus ?? 1000,
        refereeBonus: settings?.refereeBonus ?? 1000,
        referralMinTradeRequirement: settings?.referralMinTradeRequirement ?? 0,
        referralDescription: settings?.referralDescription || 'Invite friends and both earn ₦1,000 bonus!',
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin: Get Referral Settings ────────────────────────────────────────────
// @route  GET /api/admin/referrals/settings
export const getAdminReferralSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }

    res.json({
      referralEnabled: settings.referralEnabled ?? true,
      referrerBonus: settings.referrerBonus ?? 1000,
      refereeBonus: settings.refereeBonus ?? 1000,
      referralMinTradeRequirement: settings.referralMinTradeRequirement ?? 0,
      referralDescription: settings.referralDescription || 'Invite friends to Peeritrade. Both receive ₦1,000 bonus!',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin: Update Referral Settings ─────────────────────────────────────────
// @route  PUT /api/admin/referrals/settings
export const updateAdminReferralSettings = async (req: Request, res: Response) => {
  try {
    const { 
      referralEnabled, 
      referrerBonus, 
      refereeBonus, 
      referralMinTradeRequirement, 
      referralDescription 
    } = req.body;

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    if (referralEnabled !== undefined) settings.referralEnabled = Boolean(referralEnabled);
    if (referrerBonus !== undefined) settings.referrerBonus = Number(referrerBonus);
    if (refereeBonus !== undefined) settings.refereeBonus = Number(refereeBonus);
    if (referralMinTradeRequirement !== undefined) {
      settings.referralMinTradeRequirement = Number(referralMinTradeRequirement);
    }
    if (referralDescription !== undefined) {
      settings.referralDescription = String(referralDescription);
    }

    await settings.save();

    res.json({
      message: 'Referral settings updated successfully',
      settings: {
        referralEnabled: settings.referralEnabled,
        referrerBonus: settings.referrerBonus,
        refereeBonus: settings.refereeBonus,
        referralMinTradeRequirement: settings.referralMinTradeRequirement,
        referralDescription: settings.referralDescription,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Win Receipt Social Share Bonus Engine ──────────────────────────────────
// Rules:
// 1. Only share wins
// 2. Share to social media
// 3. Sharer gets 1k bonus, referee also gets 1k on joining
// 4. Limit to 3 shares per week
// 5. Cannot share the same receipt twice (anti-abuse)

// @route  POST /api/referrals/claim-win-share
// @access Private
export const claimWinReceiptBonus = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { tradeId, platform = 'social_share', profitAmount = 0 } = req.body;
    if (!tradeId) {
      return res.status(400).json({ message: 'Valid trade ID is required to claim win receipt reward' });
    }

    const cleanTradeId = String(tradeId).trim();

    // Rule 5: Make sure they won't be able to share the same receipt twice
    const existingShare = await WinReceiptShare.findOne({ tradeId: cleanTradeId });
    if (existingShare) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_SHARED',
        message: 'This win receipt has already been shared and rewarded! Each winning receipt can only be rewarded once.',
      });
    }

    // Rule 4: Limit the amount of times someone shares a win (3 shares per week)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sharesThisWeek = await WinReceiptShare.countDocuments({
      user: userId,
      sharedAt: { $gte: sevenDaysAgo },
    });

    if (sharesThisWeek >= 3) {
      return res.status(400).json({
        success: false,
        code: 'WEEKLY_LIMIT_REACHED',
        message: 'Weekly limit reached. You can earn bonuses for sharing a maximum of 3 win receipts per week.',
        weeklyLimit: 3,
        sharesThisWeek,
        remainingThisWeek: 0,
      });
    }

    // Find User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const BONUS_REWARD = 1000;

    // Credit user balance (Rule 3)
    user.balance = (user.balance || 0) + BONUS_REWARD;
    user.referralEarnings = (user.referralEarnings || 0) + BONUS_REWARD;
    await user.save();

    // Record Transaction
    await Transaction.create({
      user: user._id,
      type: 'referral_bonus',
      amount: BONUS_REWARD,
      status: 'completed',
      reference: `WIN_SHARE_${cleanTradeId}_${Date.now().toString(36)}`,
      description: `Win Receipt Share Bonus (1k rewarded for sharing win slip to social media)`,
    });

    // Record WinReceiptShare in database (anti-abuse record)
    const winShareRecord = await WinReceiptShare.create({
      user: user._id,
      tradeId: cleanTradeId,
      tradeType: cleanTradeId.startsWith('pool_') ? 'pool' : cleanTradeId.startsWith('p2p_') ? 'p2p' : 'trade',
      profitAmount: Number(profitAmount) || 0,
      bonusAmount: BONUS_REWARD,
      platform,
      sharedAt: new Date(),
    });

    // In-app Notification
    const remainingShares = Math.max(0, 2 - sharesThisWeek);
    await createNotification(
      user._id.toString(),
      '₦1,000 Win Share Bonus Credited! 🎁',
      `You received ₦1,000 bonus for sharing your winning trade receipt! You have ${remainingShares} bonus shares remaining this week.`,
      'wallet'
    );

    res.json({
      success: true,
      message: `₦1,000 bonus successfully credited to your wallet! 🎉`,
      bonus: BONUS_REWARD,
      newBalance: user.balance,
      sharesThisWeek: sharesThisWeek + 1,
      remainingThisWeek: remainingShares,
      shareRecord: winShareRecord,
    });
  } catch (error: any) {
    console.error('Error claiming win receipt share bonus:', error);
    res.status(500).json({ message: error.message || 'Failed to claim share bonus' });
  }
};

// @route  GET /api/referrals/win-share-status/:tradeId
// @access Private
export const getWinReceiptShareStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const rawTradeId = req.params.tradeId;
    const tradeId = String(rawTradeId || '').trim();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sharesThisWeek = await WinReceiptShare.countDocuments({
      user: userId,
      sharedAt: { $gte: sevenDaysAgo },
    });

    const isTradeShared = tradeId ? await WinReceiptShare.exists({ tradeId }) : false;

    res.json({
      weeklyLimit: 3,
      sharesThisWeek,
      remainingThisWeek: Math.max(0, 3 - sharesThisWeek),
      canShareThisWeek: sharesThisWeek < 3,
      isTradeShared: Boolean(isTradeShared),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

