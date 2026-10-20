import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Referral from '../models/Referral';
import WinReceiptShare from '../models/WinReceiptShare';
import SystemSetting from '../models/SystemSetting';
import Transaction from '../models/Transaction';
import P2POrder from '../models/P2POrder';
import PoolContract from '../models/PoolContract';
import Bet from '../models/Bet';
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

    // Win Receipt Shares aggregation
    const totalWinShares = await WinReceiptShare.countDocuments();
    const winBonusAgg = await WinReceiptShare.aggregate([
      {
        $group: {
          _id: null,
          totalWinBonus: { $sum: '$bonusAmount' }
        }
      }
    ]);
    const totalWinBonusPaid = winBonusAgg[0]?.totalWinBonus || 0;
    const totalBonusPaid = totalReferrerBonus + totalRefereeBonus + totalWinBonusPaid;

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

    // Recent 50 Win Receipt Shares
    const recentWinShares = await WinReceiptShare.find()
      .populate('user', 'firstName lastName email referralCode')
      .sort({ sharedAt: -1 })
      .limit(50);

    const settings = await SystemSetting.findOne();

    res.json({
      totalReferrals,
      totalBonusPaid,
      totalReferrerBonus,
      totalRefereeBonus,
      totalWinShares,
      totalWinBonusPaid,
      activeReferrersCount: topReferrers.length,
      topReferrers,
      recentReferrals,
      recentWinShares,
      settings: {
        referralEnabled: settings?.referralEnabled ?? true,
        referrerBonus: settings?.referrerBonus ?? 1000,
        refereeBonus: settings?.refereeBonus ?? 1000,
        winReceiptShareBonus: settings?.winReceiptShareBonus ?? 1000,
        winReceiptWeeklyLimit: settings?.winReceiptWeeklyLimit ?? 3,
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
      winReceiptShareBonus: settings.winReceiptShareBonus ?? 1000,
      winReceiptWeeklyLimit: settings.winReceiptWeeklyLimit ?? 3,
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
      winReceiptShareBonus,
      winReceiptWeeklyLimit,
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
    if (winReceiptShareBonus !== undefined) settings.winReceiptShareBonus = Number(winReceiptShareBonus);
    if (winReceiptWeeklyLimit !== undefined) settings.winReceiptWeeklyLimit = Number(winReceiptWeeklyLimit);
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
        winReceiptShareBonus: settings.winReceiptShareBonus,
        winReceiptWeeklyLimit: settings.winReceiptWeeklyLimit,
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

// Helper to verify a trade belongs to user and is a winning outcome
const verifyUserWinningTrade = async (userId: any, cleanTradeId: string): Promise<{ isWin: boolean; actualProfit: number; tradeType: string }> => {
  if (cleanTradeId.startsWith('p2p_')) {
    const rawId = cleanTradeId.replace('p2p_', '');
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      const order = await P2POrder.findOne({ _id: rawId, user: userId });
      if (order && order.outcomeResult === 'WON') {
        const profit = order.grossProfit || (order.payout ? order.payout - order.totalAmount : order.totalAmount || 5000);
        return { isWin: true, actualProfit: profit, tradeType: 'p2p' };
      }
    }
  } else if (cleanTradeId.startsWith('pool_')) {
    const rawId = cleanTradeId.replace('pool_', '');
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      const contract = await PoolContract.findOne({ _id: rawId, user: userId });
      if (contract && contract.status === 'WON') {
        const profit = contract.payout ? contract.payout - contract.stake : contract.stake || 5000;
        return { isWin: true, actualProfit: profit, tradeType: 'pool' };
      }
    }
  } else if (cleanTradeId.startsWith('bet_')) {
    const rawId = cleanTradeId.replace('bet_', '');
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      const bet = await Bet.findOne({ _id: rawId, user: userId });
      if (bet && bet.status === 'WON') {
        const profit = bet.potentialPayout ? bet.potentialPayout - bet.amount : bet.amount || 5000;
        return { isWin: true, actualProfit: profit, tradeType: 'bet' };
      }
    }
  } else if (cleanTradeId === 'demo_2') {
    // Verified demo won trade
    return { isWin: true, actualProfit: 5000, tradeType: 'demo' };
  } else if (mongoose.Types.ObjectId.isValid(cleanTradeId)) {
    const [order, contract, bet] = await Promise.all([
      P2POrder.findOne({ _id: cleanTradeId, user: userId, outcomeResult: 'WON' }),
      PoolContract.findOne({ _id: cleanTradeId, user: userId, status: 'WON' }),
      Bet.findOne({ _id: cleanTradeId, user: userId, status: 'WON' }),
    ]);
    if (order) return { isWin: true, actualProfit: order.grossProfit || order.payout || 5000, tradeType: 'p2p' };
    if (contract) return { isWin: true, actualProfit: contract.payout || contract.stake || 5000, tradeType: 'pool' };
    if (bet) return { isWin: true, actualProfit: bet.potentialPayout || bet.amount || 5000, tradeType: 'bet' };
  }

  return { isWin: false, actualProfit: 0, tradeType: 'invalid' };
};

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

    // Rule 1: They should only be able to share their wins
    const verification = await verifyUserWinningTrade(userId, cleanTradeId);
    if (!verification.isWin) {
      return res.status(400).json({
        success: false,
        code: 'NOT_A_WIN',
        message: 'Only verified winning trades can be shared to earn referral bonuses. (Rule 1: Wins only)',
      });
    }

    // Check system settings for referral bonus and limits
    const settings = await SystemSetting.findOne();
    if (settings && settings.referralEnabled === false) {
      return res.status(400).json({
        success: false,
        code: 'PROGRAM_DISABLED',
        message: 'The referral and win receipt program is currently paused by admin.',
      });
    }

    const weeklyLimit = settings?.winReceiptWeeklyLimit ?? 3;
    const BONUS_REWARD = settings?.winReceiptShareBonus ?? 1000;

    // Rule 5: Make sure they won't be able to share the same receipt twice (anti-abuse)
    const existingShare = await WinReceiptShare.findOne({ tradeId: cleanTradeId });
    if (existingShare) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_SHARED',
        message: 'This win receipt has already been shared and rewarded! Each winning receipt can only be rewarded once.',
      });
    }

    // Rule 4: Limit the amount of times someone shares a win (Admin-configurable, default 3 per week)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sharesThisWeek = await WinReceiptShare.countDocuments({
      user: userId,
      sharedAt: { $gte: sevenDaysAgo },
    });

    if (sharesThisWeek >= weeklyLimit) {
      return res.status(400).json({
        success: false,
        code: 'WEEKLY_LIMIT_REACHED',
        message: `Weekly limit reached. You can earn bonuses for sharing a maximum of ${weeklyLimit} win receipts per week.`,
        weeklyLimit,
        sharesThisWeek,
        remainingThisWeek: 0,
      });
    }

    // Find User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Rule 3: Sharer gets bonus immediately credited to their wallet
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
      description: `Win Receipt Share Bonus (₦${BONUS_REWARD.toLocaleString()} rewarded for sharing verified win to ${platform})`,
    });

    // Record WinReceiptShare in database (anti-abuse record preventing duplicate claims)
    const winShareRecord = await WinReceiptShare.create({
      user: user._id,
      tradeId: cleanTradeId,
      tradeType: verification.tradeType,
      profitAmount: verification.actualProfit || Number(profitAmount) || 0,
      bonusAmount: BONUS_REWARD,
      platform,
      sharedAt: new Date(),
    });

    // In-app Notification
    const remainingShares = Math.max(0, weeklyLimit - (sharesThisWeek + 1));
    await createNotification(
      user._id.toString(),
      `₦${BONUS_REWARD.toLocaleString()} Win Share Bonus Credited! 🎁`,
      `You received ₦${BONUS_REWARD.toLocaleString()} bonus for sharing your winning trade receipt! You have ${remainingShares} bonus shares remaining this week.`,
      'wallet'
    );

    res.json({
      success: true,
      message: `₦${BONUS_REWARD.toLocaleString()} bonus successfully credited to your wallet! 🎉`,
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

    const settings = await SystemSetting.findOne();
    const weeklyLimit = settings?.winReceiptWeeklyLimit ?? 3;
    const bonusAmount = settings?.winReceiptShareBonus ?? 1000;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sharesThisWeek = await WinReceiptShare.countDocuments({
      user: userId,
      sharedAt: { $gte: sevenDaysAgo },
    });

    const isTradeShared = tradeId && tradeId !== 'none'
      ? await WinReceiptShare.exists({ tradeId })
      : false;

    let isEligibleWin = false;
    if (tradeId && tradeId !== 'none') {
      const v = await verifyUserWinningTrade(userId, tradeId);
      isEligibleWin = v.isWin;
    }

    res.json({
      weeklyLimit,
      bonusAmount,
      sharesThisWeek,
      remainingThisWeek: Math.max(0, weeklyLimit - sharesThisWeek),
      canShareThisWeek: sharesThisWeek < weeklyLimit,
      isTradeShared: Boolean(isTradeShared),
      isEligibleWin,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

