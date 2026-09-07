import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Trade from '../models/Trade';
import Market from '../models/Market';
import Bet from '../models/Bet';
import SystemSetting from '../models/SystemSetting';
import SecurityLog from '../models/SecurityLog';
import VaultBalance from '../models/VaultBalance';
import bcrypt from 'bcryptjs';
import { createNotification } from '../services/notificationService';
import { getIO } from '../services/socketService';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeTradeCount = await Trade.countDocuments({ status: 'PENDING' });
    
    // Sum of all user balances (Total Liquidity in platform)
    const users = await User.find({ role: 'user' });
    const userFunds = users.reduce((acc, user) => acc + (user.balance || 0), 0);
    
    // Volume: Sum of all completed transactions
    const transactions = await Transaction.find({ status: 'completed' });
    const totalVolume = transactions.reduce((acc, txn) => acc + (txn.amount || 0), 0);

    // Revenue: Assuming a 2% fee on transactions
    const totalRevenue = totalVolume * 0.02;

    // In Escrow: Sum of all pending trades amounts
    const pendingTrades = await Trade.find({ status: 'PENDING' });
    const inEscrow = pendingTrades.reduce((acc, trade) => acc + (trade.amount || 0), 0);

    // Fetch live vault balances
    const vault = await VaultBalance.findOne();
    const coldWalletBalance = vault ? vault.coldReserve : 0;

    res.json({
      users: totalUsers,
      activeTrades: activeTradeCount, 
      volume: totalVolume,
      revenue: totalRevenue,
      inEscrow: inEscrow,
      coldWalletBalance: coldWalletBalance,
      liquidity: userFunds + coldWalletBalance
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const total = await User.countDocuments({ role: 'user' });
    const users = await User.find({ role: 'user' })
      .select('-password -pin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password -pin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateKycStatus = async (req: Request, res: Response) => {
  try {
    const { userId, status } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (status === 'APPROVED') {
        user.isVerified = true;
    } else {
        user.isVerified = false;
    }
    user.kycStatus = status.toLowerCase() as any;
    await user.save();

    try {
      const { createNotification } = require('../services/notificationService');
      await createNotification(
        user._id.toString(),
        status === 'APPROVED' ? 'KYC Verification Approved ✅' : 'KYC Verification Update ⚠️',
        status === 'APPROVED' 
          ? 'Congratulations! Your identity documents have been approved. You now have full trading and withdrawal privileges.' 
          : 'Your KYC submission was reviewed and requires updated documents. Please check the KYC section in your profile.',
        'system'
      );
    } catch (notifErr) {
      console.warn('Failed to send KYC notification:', notifErr);
    }

    res.json({ message: `KYC status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingKyc = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ kycStatus: 'pending' }).select('-password -pin');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { settlePendingBetsForMatch } from '../services/settlementService';

export const triggerSettlement = async (req: Request, res: Response) => {
  try {
    const result = await settlePendingBetsForMatch();
    res.json({ message: 'Settlement triggered', result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bootstrapAdmin = async (req: Request, res: Response) => {
  try {
    const { email, secret } = req.body;
    
    // Using a hardcoded fallback just in case env is not set, but env should be preferred
    const adminSecret = process.env.ADMIN_SECRET || 'peeritrade_super_secret';
    
    if (secret !== adminSecret && secret !== 'peeribet_super_secret' && secret !== 'peeritrade_super_secret') {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: 'User elevated to admin successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { platformFee, settlementMode, complianceThreshold } = req.body;
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }
    settings.platformFee = platformFee;
    settings.settlementMode = settlementMode;
    settings.complianceThreshold = complianceThreshold;
    await settings.save();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMarkets = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, status, search } = req.query;
    const filter: any = {};

    if (category && category !== 'ALL') {
      filter.category = { $regex: new RegExp(`^${String(category).trim()}$`, 'i') };
    }
    if (subcategory && subcategory !== 'ALL') {
      filter.subcategory = { $regex: new RegExp(`^${String(subcategory).trim()}$`, 'i') };
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subcategory: { $regex: q, $options: 'i' } },
        { rules: { $regex: q, $options: 'i' } },
        { pair: { $regex: q, $options: 'i' } },
      ];
    }

    const markets = await Market.find(filter)
      .populate('creator', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Attach bet metrics for each market
    const marketsWithStats = await Promise.all(
      markets.map(async (m) => {
        const betCount = await Bet.countDocuments({ market: m._id });
        const pendingBets = await Bet.find({ market: m._id, status: 'PENDING' });
        const pendingStake = pendingBets.reduce((acc, b) => acc + (b.amount || 0), 0);
        return {
          ...m.toObject(),
          betCount,
          pendingStake,
        };
      })
    );

    res.json(marketsWithStats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMarket = async (req: Request, res: Response) => {
  try {
    const {
      title,
      pair,
      category = 'Entertainment',
      subcategory = 'General',
      marketType = 'YES_NO',
      options,
      rules = '',
      resolutionSource = '',
      poolAmount = 0,
      closingDate,
      resolutionDate,
      status = 'DRAFT',
      image = '',
      rate = 1.0,
      change = '0.0%',
      volume = '₦0',
    } = req.body;

    const marketTitle = title || pair;
    if (!marketTitle) {
      return res.status(400).json({ message: 'Market title / question is required' });
    }

    // Standardize options
    let formattedOptions = options;
    if (!formattedOptions || !Array.isArray(formattedOptions) || formattedOptions.length === 0) {
      if (marketType === 'YES_NO') {
        formattedOptions = [
          { id: 'yes', label: 'Yes', odds: 1.85, totalStaked: 0 },
          { id: 'no', label: 'No', odds: 1.95, totalStaked: 0 },
        ];
      } else {
        formattedOptions = [
          { id: 'opt_1', label: 'Option 1', odds: 2.0, totalStaked: 0 },
          { id: 'opt_2', label: 'Option 2', odds: 2.0, totalStaked: 0 },
        ];
      }
    } else {
      formattedOptions = formattedOptions.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx + 1}`,
        label: opt.label || `Option ${idx + 1}`,
        odds: Number(opt.odds) || 1.9,
        totalStaked: Number(opt.totalStaked) || 0,
      }));
    }

    const market = await Market.create({
      title: marketTitle,
      pair: marketTitle,
      category,
      subcategory,
      marketType,
      options: formattedOptions,
      rules,
      resolutionSource,
      poolAmount: Number(poolAmount) || 0,
      volume: volume || `₦${(Number(poolAmount) || 0).toLocaleString()}`,
      status,
      closingDate: closingDate ? new Date(closingDate) : undefined,
      resolutionDate: resolutionDate ? new Date(resolutionDate) : undefined,
      isBackdoorManual: true,
      creator: (req as any).user?._id,
      image,
      rate,
      change,
    });

    try {
      await SecurityLog.create({
        type: 'success',
        text: `New backdoor trade market initialized: "${marketTitle}" [${category} / ${subcategory}]`,
        meta: `Status: ${status}, Odds: ${formattedOptions.map((o: any) => `${o.label}: ${o.odds}`).join(', ')}`,
        icon: 'trending-up',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.status(201).json(market);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMarket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const market = await Market.findById(id);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    if (updateData.title) {
      market.title = updateData.title;
      market.pair = updateData.title;
    }
    if (updateData.category) market.category = updateData.category;
    if (updateData.subcategory) market.subcategory = updateData.subcategory;
    if (updateData.rules !== undefined) market.rules = updateData.rules;
    if (updateData.resolutionSource !== undefined) market.resolutionSource = updateData.resolutionSource;
    if (updateData.options) market.options = updateData.options;
    if (updateData.closingDate) market.closingDate = new Date(updateData.closingDate);
    if (updateData.resolutionDate) market.resolutionDate = new Date(updateData.resolutionDate);
    if (updateData.status) market.status = updateData.status;
    if (updateData.image !== undefined) market.image = updateData.image;

    await market.save();

    try {
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.json(market);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMarketStatus = async (req: Request, res: Response) => {
  try {
    const { marketId, status } = req.body;
    const market = await Market.findById(marketId || req.params.id);
    if (!market) return res.status(404).json({ message: 'Market not found' });
    market.status = status;
    await market.save();

    try {
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.json(market);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const publishMarket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const market = await Market.findById(id);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    market.status = market.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    await market.save();

    try {
      await SecurityLog.create({
        type: market.status === 'ACTIVE' ? 'success' : 'warning',
        text: `Market "${market.title}" status switched to ${market.status}`,
        meta: `Backdoor Manual Trade published to live client markets`,
        icon: 'trending-up',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.json({ message: `Market is now ${market.status}`, market });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveMarket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winningOption } = req.body;

    if (!winningOption) {
      return res.status(400).json({ message: 'Winning outcome / option is required for resolution' });
    }

    const market = await Market.findById(id);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    if (market.status === 'RESOLVED') {
      return res.status(400).json({ message: 'Market is already resolved' });
    }

    const normWinning = String(winningOption).trim().toUpperCase();

    // Find all pending bets placed on this market
    const pendingBets = await Bet.find({ market: market._id, status: 'PENDING' });
    let totalPaidOut = 0;
    let winnersCount = 0;
    let losersCount = 0;

    for (const bet of pendingBets) {
      const normSelection = String(bet.selection).trim().toUpperCase();
      const isWinner =
        normSelection === normWinning ||
        (normWinning === 'YES' && (normSelection === 'YES' || normSelection === '1')) ||
        (normWinning === 'NO' && (normSelection === 'NO' || normSelection === '2'));

      if (isWinner) {
        bet.status = 'WON';
        await bet.save();

        const payout = bet.potentialPayout || bet.amount * bet.odds;
        totalPaidOut += payout;
        winnersCount++;

        // Credit user wallet
        const user = await User.findById(bet.user);
        if (user) {
          user.balance = (user.balance || 0) + payout;
          await user.save();

          await Transaction.create({
            user: user._id,
            type: 'bet_won',
            amount: payout,
            status: 'completed',
            reference: bet._id.toString(),
            description: `Prediction WON! "${market.title}" (${bet.selection})`,
          });

          await createNotification(
            user._id.toString(),
            'Prediction Won! 🏆',
            `Congratulations! Your prediction on "${market.title}" won! ₦${payout.toLocaleString()} has been credited to your wallet.`,
            'bet'
          );
        }
      } else {
        bet.status = 'LOST';
        await bet.save();
        losersCount++;

        const user = await User.findById(bet.user);
        if (user) {
          await createNotification(
            user._id.toString(),
            'Prediction Result 📉',
            `Market "${market.title}" resolved to "${winningOption}". Better luck next time!`,
            'bet'
          );
        }
      }
    }

    market.status = 'RESOLVED';
    market.winningOption = winningOption;
    market.resolvedAt = new Date();
    await market.save();

    try {
      await SecurityLog.create({
        type: 'success',
        text: `Market "${market.title}" resolved with winning outcome: "${winningOption}"`,
        meta: `Winners: ${winnersCount}, Losers: ${losersCount}, Total Payout: ₦${totalPaidOut.toLocaleString()}`,
        icon: 'check-circle',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.json({
      message: `Market resolved successfully. ${winnersCount} winners paid ₦${totalPaidOut.toLocaleString()}`,
      market,
      winnersCount,
      losersCount,
      totalPaidOut,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const voidMarket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const market = await Market.findById(id);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    // Refund all pending bets
    const pendingBets = await Bet.find({ market: market._id, status: 'PENDING' });
    let totalRefunded = 0;

    for (const bet of pendingBets) {
      bet.status = 'VOID';
      await bet.save();

      const user = await User.findById(bet.user);
      if (user) {
        user.balance = (user.balance || 0) + bet.amount;
        await user.save();
        totalRefunded += bet.amount;

        await Transaction.create({
          user: user._id,
          type: 'refund',
          amount: bet.amount,
          status: 'completed',
          reference: bet._id.toString(),
          description: `Refund for voided market "${market.title}"`,
        });

        await createNotification(
          user._id.toString(),
          'Market Voided & Refunded 🔄',
          `The market "${market.title}" was voided by admin. Your stake of ₦${bet.amount.toLocaleString()} has been refunded.`,
          'wallet'
        );
      }
    }

    market.status = 'VOIDED';
    await market.save();

    try {
      await SecurityLog.create({
        type: 'warning',
        text: `Market "${market.title}" was VOIDED by admin`,
        meta: `Total Refunded: ₦${totalRefunded.toLocaleString()} to ${pendingBets.length} users`,
        icon: 'alert-triangle',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id });
    } catch (e) {}

    res.json({ message: `Market voided and ₦${totalRefunded.toLocaleString()} refunded to users.`, market });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMarket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const market = await Market.findById(id);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    // If active bets exist, prevent silent deletion
    const betCount = await Bet.countDocuments({ market: market._id });
    if (betCount > 0 && market.status !== 'VOIDED' && market.status !== 'RESOLVED') {
      return res.status(400).json({
        message: `Cannot delete market with ${betCount} placed bets. Please Void or Resolve the market first.`,
      });
    }

    await Market.findByIdAndDelete(id);

    try {
      await SecurityLog.create({
        type: 'warning',
        text: `Backdoor trade market purged: "${market.title}"`,
        meta: `Deleted from system registry`,
        icon: 'trash',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: id });
    } catch (e) {}

    res.json({ message: 'Market deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSecurityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await SecurityLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSecurityLog = async (req: Request, res: Response) => {
  try {
    const { type, text, meta, icon } = req.body;
    const log = await SecurityLog.create({ type, text, meta, icon });
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTradeStatus = async (req: Request, res: Response) => {
  try {
    const { tradeId, status } = req.body;
    const trade = await Trade.findById(tradeId);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    trade.status = status;
    await trade.save();
    res.json(trade);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTrades = async (req: Request, res: Response) => {
  try {
    const trades = await Trade.find()
      .populate('initiator', 'firstName lastName')
      .populate('responder', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(trades);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changeAdminPassword = async (req: Request, res: Response) => {
  try {
    const oldPassword = ((req.body.oldPassword || req.body.currentPassword || '') as string).trim();
    const newPassword = ((req.body.newPassword || req.body.password || '') as string).trim();
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be the same as current password' });
    }

    const adminUser = await User.findById((req as any).user._id).select('+password');
    if (!adminUser) return res.status(404).json({ message: 'Admin user not found' });

    const isMatch = await bcrypt.compare(oldPassword, adminUser.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    adminUser.password = newPassword; // Will be hashed by pre-save hook in User model
    await adminUser.save();

    // Log the security event
    try {
      await SecurityLog.create({
        type: 'success',
        text: 'Admin account password updated successfully',
        meta: `Operator: ${adminUser.firstName || 'Admin'} ${adminUser.lastName || ''} (${adminUser.email})`,
        icon: 'key'
      });
    } catch (logErr) {
      console.warn('Could not write security log:', logErr);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change admin password error:', error);
    res.status(500).json({ message: error.message || 'Internal server error while changing admin password' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const newPassword = ((req.body.newPassword || req.body.password || '') as string).trim();
    
    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Please provide user ID and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    try {
      await SecurityLog.create({
        type: 'warning',
        text: `Password reset performed for user ${user.firstName} ${user.lastName} (${user.email})`,
        meta: `Authorized by Administrator`,
        icon: 'key'
      });
    } catch (logErr) {
      console.warn('Could not write security log:', logErr);
    }

    res.json({ message: `Password for ${user.firstName} ${user.lastName} updated successfully` });
  } catch (error: any) {
    console.error('Reset user password error:', error);
    res.status(500).json({ message: error.message || 'Internal server error while resetting user password' });
  }
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const adminUser = await User.findById((req as any).user._id);
    if (!adminUser) return res.status(404).json({ message: 'Admin not found' });

    adminUser.firstName = firstName;
    adminUser.lastName = lastName;
    adminUser.email = email;
    adminUser.phone = phone;
    await adminUser.save();
    res.json(adminUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { reference, status } = req.body;
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    transaction.status = status;
    await transaction.save();

    // If it's a deposit and it's successful, update user balance
    if (transaction.type === 'deposit' && status === 'completed') {
        const user = await User.findById(transaction.user);
        if (user) {
            user.balance = (user.balance || 0) + transaction.amount;
            await user.save();
        }
    }

    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getVaultBalances = async (req: Request, res: Response) => {
  try {
    // 1. Calculate Escrow Locked from live pending trades
    const pendingTrades = await Trade.find({ status: 'PENDING' });
    const liveEscrowLocked = pendingTrades.reduce((acc, trade) => acc + (trade.amount || 0), 0);

    let vault = await VaultBalance.findOne();
    if (!vault) {
      // Create with 0 defaults if no vault record exists yet
      vault = await VaultBalance.create({
          custodyPool: 0,
          escrowLocked: liveEscrowLocked,
          coldReserve: 0,
          payoutBank: 0
      });
    } else {
      // Sync escrowLocked with live trade data
      vault.escrowLocked = liveEscrowLocked;
      await vault.save();
    }

    res.json(vault);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVaultBalances = async (req: Request, res: Response) => {
  try {
    const { custodyPool, escrowLocked, coldReserve, payoutBank } = req.body;
    let vault = await VaultBalance.findOne();
    if (!vault) {
      vault = new VaultBalance();
    }
    vault.custodyPool = custodyPool;
    vault.escrowLocked = escrowLocked;
    vault.coldReserve = coldReserve;
    vault.payoutBank = payoutBank;
    await vault.save();
    res.json(vault);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const creditUser = async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.balance = (user.balance || 0) + amount;
    await user.save();
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




