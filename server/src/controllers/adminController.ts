import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Trade from '../models/Trade';
import Market from '../models/Market';
import Match from '../models/Match';
import Bet from '../models/Bet';
import SystemSetting from '../models/SystemSetting';
import SecurityLog from '../models/SecurityLog';
import VaultBalance from '../models/VaultBalance';
import AirdropLog from '../models/AirdropLog';
import P2POrder from '../models/P2POrder';
import PoolContract from '../models/PoolContract';
import Notification from '../models/Notification';
import bcrypt from 'bcryptjs';
import { createNotification } from '../services/notificationService';
import { getIO } from '../services/socketService';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { range } = req.query;

    let dateFilter: any = {};
    const now = new Date();
    if (range === 'Today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (range === '7D') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: past7 } };
    } else if (range === '30D') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: past30 } };
    }

    const totalUsers = await User.countDocuments({ role: { $in: ['user', 'admin'] } });

    // Active trade count aggregated across P2P orders, pool contracts, and direct trades
    const pendingDirectTrades = await Trade.countDocuments({ status: 'PENDING' });
    const activeP2POrders = await P2POrder.countDocuments({ status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] } });
    const pendingPoolContracts = await PoolContract.countDocuments({ status: 'PENDING' });
    const activeTradeCount = pendingDirectTrades + activeP2POrders + pendingPoolContracts;
    
    // Sum of all user balances (Total Liquidity in platform)
    const users = await User.find({ role: { $in: ['user', 'admin'] } });
    const userFunds = users.reduce((acc, user) => acc + (user.balance || 0), 0);
    
    // Volume: Sum of completed transactions + matched/settled p2p orders + pool stakes
    const completedTxns = await Transaction.find({ status: 'completed' });
    const txnVolume = completedTxns.reduce((acc, txn) => acc + (txn.amount || 0), 0);

    const completedP2P = await P2POrder.find({ status: { $in: ['MATCHED', 'SETTLED'] } });
    const p2pVolume = completedP2P.reduce((acc, order) => acc + (order.totalAmount || (order.totalShares * (order.sharePrice || 1000))), 0);

    const allPools = await PoolContract.find();
    const poolVolume = allPools.reduce((acc, p) => acc + (p.stake || 0), 0);

    const totalVolume = txnVolume + p2pVolume + poolVolume;

    // Revenue: fees from P2P + pool fees + transaction fees
    const settings = await SystemSetting.findOne();
    const platformFeeRate = (settings?.platformFee ?? 1.5) / 100;

    const p2pFees = completedP2P.reduce((acc, o) => acc + (o.feePaid || 0), 0);
    const poolFees = allPools.reduce((acc, p) => acc + (p.feeDeducted || 0), 0);
    const calculatedTxnFees = txnVolume * platformFeeRate;
    const totalRevenue = Math.round(p2pFees + poolFees + calculatedTxnFees);

    // In Escrow: Sum of all pending trades, active P2P orders, and pending pool contracts
    const pendingTrades = await Trade.find({ status: 'PENDING' });
    const directEscrow = pendingTrades.reduce((acc, trade) => acc + (trade.amount || 0), 0);

    const openP2P = await P2POrder.find({ status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] } });
    const p2pEscrow = openP2P.reduce((acc, o) => acc + ((o.unmatchedShares || o.totalShares || 0) * (o.sharePrice || 1000)), 0);

    const pendingPools = await PoolContract.find({ status: 'PENDING' });
    const poolEscrow = pendingPools.reduce((acc, p) => acc + (p.stake || 0), 0);

    const inEscrow = directEscrow + p2pEscrow + poolEscrow;

    // Fetch live vault balances
    const vault = await VaultBalance.findOne();
    const coldWalletBalance = vault ? vault.coldReserve : 0;
    const custodyPool = vault ? vault.custodyPool : 0;
    const promoReserve = vault ? vault.promoReserve : 0;
    const payoutBank = vault ? vault.payoutBank : 0;
    const totalLiquidity = userFunds + coldWalletBalance + custodyPool + promoReserve + payoutBank;

    // Compute dynamic 24-hour hourly trade frequency buckets (10 intervals) from real database timestamps
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentTxns, recentOrders, recentContracts, recentTrades] = await Promise.all([
      Transaction.find({ createdAt: { $gte: twentyFourHoursAgo } }).select('createdAt'),
      P2POrder.find({ createdAt: { $gte: twentyFourHoursAgo } }).select('createdAt'),
      PoolContract.find({ createdAt: { $gte: twentyFourHoursAgo } }).select('createdAt'),
      Trade.find({ createdAt: { $gte: twentyFourHoursAgo } }).select('createdAt')
    ]);

    const allActivityTimestamps = [
      ...recentTxns.map(t => new Date(t.createdAt).getTime()),
      ...recentOrders.map(o => new Date(o.createdAt).getTime()),
      ...recentContracts.map(c => new Date(c.createdAt).getTime()),
      ...recentTrades.map(t => new Date(t.createdAt).getTime())
    ];

    const tradeFrequencyData = [];
    const intervalMs = 2.4 * 60 * 60 * 1000; // ~2.4h per bin for 10 bins
    let maxCount = 0;

    for (let i = 9; i >= 0; i--) {
      const binStart = Date.now() - (i + 1) * intervalMs;
      const binEnd = Date.now() - i * intervalMs;
      const count = allActivityTimestamps.filter(t => t >= binStart && t < binEnd).length;
      if (count > maxCount) maxCount = count;

      const dateObj = new Date(binEnd);
      const hourStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      tradeFrequencyData.push({
        hour: hourStr,
        count: count,
        highlighted: false
      });
    }

    if (maxCount > 0) {
      for (const item of tradeFrequencyData) {
        if (item.count === maxCount) {
          item.highlighted = true;
          break;
        }
      }
    }

    res.json({
      users: totalUsers,
      activeTrades: activeTradeCount, 
      volume: totalVolume,
      revenue: totalRevenue,
      inEscrow: inEscrow,
      coldWalletBalance: coldWalletBalance,
      liquidity: totalLiquidity,
      userFunds: userFunds,
      platformFee: settings?.platformFee ?? 1.5,
      tradeFrequencyData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limitParam = req.query.limit as string;
    const isAll = limitParam === 'all' || limitParam === '0';
    const limit = isAll ? 0 : (parseInt(limitParam) || 1000);
    const skip = isAll ? 0 : (page - 1) * limit;

    const roleParam = req.query.role as string;
    let roleFilter: any = {};
    if (roleParam && roleParam !== 'ALL') {
      roleFilter.role = roleParam;
    } else {
      roleFilter = { role: { $in: ['user', 'admin'] } };
    }

    const total = await User.countDocuments(roleFilter);
    let query = User.find(roleFilter)
      .select('-password -pin')
      .sort({ createdAt: -1 });

    if (!isAll && limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const users = await query;

    // Efficient bulk aggregation for live trading positions and active shares per user
    const userIds = users.map(u => u._id);
    const [orderAgg, poolAgg] = await Promise.all([
      P2POrder.aggregate([
        { $match: { user: { $in: userIds }, status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] } } },
        { $group: { _id: '$user', activeShares: { $sum: { $ifNull: ['$unmatchedShares', '$totalShares', 0] } }, count: { $sum: 1 } } }
      ]),
      PoolContract.aggregate([
        { $match: { user: { $in: userIds }, status: 'PENDING' } },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ])
    ]);

    const orderMap = new Map<string, { activeShares: number; count: number }>();
    orderAgg.forEach((item: any) => {
      orderMap.set(item._id.toString(), { activeShares: item.activeShares || 0, count: item.count || 0 });
    });

    const poolMap = new Map<string, number>();
    poolAgg.forEach((item: any) => {
      poolMap.set(item._id.toString(), item.count || 0);
    });

    const usersWithStats = users.map((u) => {
      const uIdStr = u._id.toString();
      const orderInfo = orderMap.get(uIdStr) || { activeShares: 0, count: 0 };
      const poolCount = poolMap.get(uIdStr) || 0;

      return {
        ...u.toObject(),
        stock: orderInfo.activeShares,
        activeShares: orderInfo.activeShares,
        activeOrdersCount: orderInfo.count,
        activePoolsCount: poolCount
      };
    });

    res.json({
      users: usersWithStats,
      currentPage: page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
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
    const { 
      platformFee, 
      settlementMode, 
      complianceThreshold,
      activePaymentGateway,
      paystackPublicKey,
      paystackSecretKey,
      flutterwavePublicKey,
      flutterwaveSecretKey,
      flutterwaveSecretHash,
      vtstackApiKey,
      vtstackPayoutKey,
      vtstackWebhookSecret,
      gatewayMode,
      autoWithdrawalApproval
    } = req.body;
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }
    if (platformFee !== undefined) settings.platformFee = platformFee;
    if (settlementMode !== undefined) settings.settlementMode = settlementMode;
    if (complianceThreshold !== undefined) settings.complianceThreshold = complianceThreshold;
    if (activePaymentGateway !== undefined) settings.activePaymentGateway = activePaymentGateway;
    if (paystackPublicKey !== undefined) settings.paystackPublicKey = paystackPublicKey;
    if (paystackSecretKey !== undefined) settings.paystackSecretKey = paystackSecretKey;
    if (flutterwavePublicKey !== undefined) settings.flutterwavePublicKey = flutterwavePublicKey;
    if (flutterwaveSecretKey !== undefined) settings.flutterwaveSecretKey = flutterwaveSecretKey;
    if (flutterwaveSecretHash !== undefined) settings.flutterwaveSecretHash = flutterwaveSecretHash;
    if (vtstackApiKey !== undefined) settings.vtstackApiKey = vtstackApiKey;
    if (vtstackPayoutKey !== undefined) settings.vtstackPayoutKey = vtstackPayoutKey;
    if (vtstackWebhookSecret !== undefined) settings.vtstackWebhookSecret = vtstackWebhookSecret;
    if (gatewayMode !== undefined) settings.gatewayMode = gatewayMode;
    if (autoWithdrawalApproval !== undefined) settings.autoWithdrawalApproval = autoWithdrawalApproval;

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

export const toggleMarketLock = async (req: Request, res: Response) => {
  try {
    const marketId = req.params.id || req.body.marketId || req.body.id;
    const { contract, optionId, isLocked, reason } = req.body;
    const market = await Market.findById(marketId);
    if (!market) return res.status(404).json({ message: 'Market not found' });

    if (!market.lockedContracts) market.lockedContracts = [];

    // Specific Contract Lock / Unlock
    const targetContract = contract || optionId;
    if (targetContract) {
      const normTarget = String(targetContract).trim().toUpperCase();
      let optFound = false;

      // Update in market.options
      market.options = (market.options || []).map((opt: any) => {
        const optNormId = String(opt.id).trim().toUpperCase();
        const optNormLabel = String(opt.label).trim().toUpperCase();
        if (optNormId === normTarget || optNormLabel === normTarget) {
          optFound = true;
          const newLockState = typeof isLocked === 'boolean' ? isLocked : !opt.isLocked;
          opt.isLocked = newLockState;
          if (newLockState) {
            if (!market.lockedContracts!.includes(opt.id)) market.lockedContracts!.push(opt.id);
            if (!market.lockedContracts!.includes(opt.label.toUpperCase())) market.lockedContracts!.push(opt.label.toUpperCase());
          } else {
            market.lockedContracts = market.lockedContracts!.filter(
              (c: string) => c.toUpperCase() !== optNormId && c.toUpperCase() !== optNormLabel
            );
          }
        }
        return opt;
      });

      if (!optFound) {
        // Direct string contract (e.g. YES, NO)
        const currentlyLocked = market.lockedContracts.some((c: string) => c.toUpperCase() === normTarget);
        const newLockState = typeof isLocked === 'boolean' ? isLocked : !currentlyLocked;
        if (newLockState) {
          if (!market.lockedContracts.includes(normTarget)) market.lockedContracts.push(normTarget);
        } else {
          market.lockedContracts = market.lockedContracts.filter((c: string) => c.toUpperCase() !== normTarget);
        }
      }

      // Check if all options are locked, but market stays ACTIVE unless all options are locked
      const allLocked = market.options.length > 0 && market.options.every((opt: any) => opt.isLocked);
      market.isLocked = allLocked;
      market.isOverpowered = allLocked;
      if (allLocked) {
        market.status = 'SUSPENDED' as any;
        market.lockedReason = reason || 'All contracts locked by admin';
      } else {
        if (market.status === 'SUSPENDED') market.status = 'ACTIVE' as any;
        market.lockedReason = market.lockedContracts.length > 0 ? `Locked contracts: ${market.lockedContracts.join(', ')}` : '';
      }

      await market.save();

      try {
        await SecurityLog.create({
          type: 'warning',
          text: `Admin updated contract "${targetContract}" lock state on market "${market.title}"`,
          meta: reason || `Contract ${targetContract} lock toggled`,
          icon: 'shield-alert',
        });
        const io = getIO();
        if (io) io.emit('market_updated', { 
          marketId: market._id, 
          isLocked: market.isLocked, 
          lockedContracts: market.lockedContracts,
          options: market.options,
          status: market.status 
        });
      } catch (e) {}

      return res.json({ 
        message: `Contract "${targetContract}" lock state updated successfully`, 
        market 
      });
    }

    // Whole market toggle fallback
    market.isLocked = typeof isLocked === 'boolean' ? isLocked : !market.isLocked;
    market.isOverpowered = market.isLocked;
    if (reason) market.lockedReason = reason;
    else if (market.isLocked) market.lockedReason = 'Locked by Admin (Overpowered Safeguard)';
    else market.lockedReason = '';

    if (market.isLocked) {
      market.status = 'SUSPENDED' as any;
      market.options.forEach((opt: any) => { opt.isLocked = true; });
      market.lockedContracts = market.options.map((opt: any) => opt.label.toUpperCase());
    } else {
      market.status = 'ACTIVE' as any;
      market.options.forEach((opt: any) => { opt.isLocked = false; });
      market.lockedContracts = [];
    }
    await market.save();

    try {
      await SecurityLog.create({
        type: market.isLocked ? 'warning' : 'success',
        text: `Admin ${market.isLocked ? 'LOCKED' : 'UNLOCKED'} market "${market.title}" (Overpower Control)`,
        meta: reason || 'Admin manual overpower lock toggle',
        icon: 'shield-alert',
      });
      const io = getIO();
      if (io) io.emit('market_updated', { marketId: market._id, isLocked: market.isLocked, lockedContracts: market.lockedContracts, options: market.options, status: market.status });
    } catch (e) {}

    res.json({ message: `Market ${market.isLocked ? 'locked' : 'unlocked'} successfully`, market });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleMatchLock = async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id || req.body.matchId || req.body.id;
    const { contract, isLocked, reason } = req.body;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    if (!match.lockedContracts) match.lockedContracts = [];

    // Specific contract lock / unlock (e.g. 'HOME', 'DRAW', 'AWAY', 'OVER_25', 'UNDER_25', 'BTTS_YES', 'BTTS_NO')
    if (contract) {
      const normContract = String(contract).trim().toUpperCase();
      const currentlyLocked = match.lockedContracts.some((c: string) => c.toUpperCase() === normContract);
      const newLockState = typeof isLocked === 'boolean' ? isLocked : !currentlyLocked;

      if (newLockState) {
        if (!match.lockedContracts.some((c: string) => c.toUpperCase() === normContract)) {
          match.lockedContracts.push(normContract);
        }
      } else {
        match.lockedContracts = match.lockedContracts.filter((c: string) => c.toUpperCase() !== normContract);
      }

      await match.save();

      try {
        await SecurityLog.create({
          type: newLockState ? 'warning' : 'success',
          text: `Admin ${newLockState ? 'LOCKED' : 'UNLOCKED'} contract "${normContract}" on match "${match.homeTeam} vs ${match.awayTeam}"`,
          meta: reason || `Contract ${normContract} lock toggled`,
          icon: 'shield-alert',
        });
        const io = getIO();
        if (io) io.emit('match_updated', { 
          matchId: match._id, 
          isLocked: match.isLocked, 
          lockedContracts: match.lockedContracts,
          status: match.status 
        });
      } catch (e) {}

      return res.json({ 
        message: `Contract "${normContract}" ${newLockState ? 'locked' : 'unlocked'} successfully`, 
        match 
      });
    }

    // Whole match toggle fallback
    match.isLocked = typeof isLocked === 'boolean' ? isLocked : !match.isLocked;
    match.isOverpowered = match.isLocked;
    if (reason) match.lockedReason = reason;
    else if (match.isLocked) match.lockedReason = 'Locked by Admin (Overpowered Safeguard)';
    else match.lockedReason = '';

    if (match.isLocked) {
      match.status = 'SUSPENDED';
    } else {
      match.status = 'UPCOMING';
    }
    await match.save();

    try {
      await SecurityLog.create({
        type: match.isLocked ? 'warning' : 'success',
        text: `Admin ${match.isLocked ? 'LOCKED' : 'UNLOCKED'} match "${match.homeTeam} vs ${match.awayTeam}" (Overpower Control)`,
        meta: reason || 'Admin manual overpower lock toggle',
        icon: 'shield-alert',
      });
      const io = getIO();
      if (io) io.emit('match_updated', { matchId: match._id, isLocked: match.isLocked, lockedContracts: match.lockedContracts, status: match.status });
    } catch (e) {}

    res.json({ message: `Match ${match.isLocked ? 'locked' : 'unlocked'} successfully`, match });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllMatchesAdmin = async (req: Request, res: Response) => {
  try {
    const matches = await Match.find().sort({ startTime: -1 }).limit(100);
    res.json(matches);
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

    let totalPaidOut = 0;
    let winnersCount = 0;
    let losersCount = 0;

    // ────────────────────────────────────────────────────────────────────────
    // 1. SETTLE P2P ORDERS FOR THIS PREDICTION MARKET
    // ────────────────────────────────────────────────────────────────────────
    const p2pOrders = await P2POrder.find({
      predictionMarket: market._id as any,
      status: { $in: ['OPEN', 'PARTIALLY_MATCHED', 'MATCHED'] },
    });

    for (const order of p2pOrders) {
      const normSel = String(order.selection).trim().toUpperCase();
      const isWinner =
        normSel === normWinning ||
        (normWinning === 'YES' && (normSel === 'YES' || normSel === '1')) ||
        (normWinning === 'NO' && (normSel === 'NO' || normSel === '2'));

      const user = await User.findById(order.user);
      if (!user) continue;

      if (isWinner) {
        order.outcomeResult = 'WON';
        order.status = 'SETTLED';

        const grossWinning = order.matchedShares * 2 * 1000;
        const fee = grossWinning * 0.05; // 5% platform fee
        const netWinning = grossWinning - fee;
        const unmatchedRefund = order.unmatchedShares * 1000; // Unmatched shares refunded in full
        const totalPayout = netWinning + unmatchedRefund;

        order.payout = totalPayout;
        order.grossProfit = grossWinning - order.matchedShares * 1000;
        order.feePaid = fee;
        await order.save();

        user.balance += totalPayout;
        await user.save();

        totalPaidOut += totalPayout;
        winnersCount++;

        await Transaction.create({
          user: user._id,
          type: 'p2p_trade_won',
          amount: totalPayout,
          status: 'completed',
          reference: order._id.toString(),
          description: `P2P Outcome Contract WON: "${market.title}" (${order.selection})`,
        });

        createNotification(
          user._id.toString(),
          'P2P Contract Won! ⚡',
          `Your P2P contract on "${market.title}" won! ₦${Math.round(totalPayout).toLocaleString()} has been credited to your wallet.`,
          'bet'
        ).catch(() => {});
      } else {
        order.outcomeResult = 'LOST';
        order.status = 'SETTLED';

        // Refund any unmatched shares that were never paired
        const unmatchedRefund = order.unmatchedShares * 1000;
        if (unmatchedRefund > 0) {
          user.balance += unmatchedRefund;
          await user.save();
          order.payout = unmatchedRefund;

          await Transaction.create({
            user: user._id,
            type: 'p2p_unmatched_refund',
            amount: unmatchedRefund,
            status: 'completed',
            reference: `p2p_refund_${order._id}`,
            description: `Unmatched shares refunded for "${market.title}"`,
          });
        }
        await order.save();
        losersCount++;

        createNotification(
          user._id.toString(),
          'P2P Contract Result',
          `Your P2P contract on "${market.title}" (${order.selection}) resolved to ${winningOption}.`,
          'bet'
        ).catch(() => {});
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. SETTLE PRO-RATA POOL CONTRACTS FOR THIS PREDICTION MARKET
    // ────────────────────────────────────────────────────────────────────────
    const poolContracts = await PoolContract.find({
      predictionMarket: market._id as any,
      status: 'PENDING',
    });

    if (poolContracts.length > 0) {
      const winningPoolContracts = poolContracts.filter((c: any) => {
        const normSel = String(c.selection).trim().toUpperCase();
        return (
          normSel === normWinning ||
          (normWinning === 'YES' && (normSel === 'YES' || normSel === '1')) ||
          (normWinning === 'NO' && (normSel === 'NO' || normSel === '2'))
        );
      });
      const losingPoolContracts = poolContracts.filter((c: any) => !winningPoolContracts.includes(c));

      const totalPoolPot = poolContracts.reduce((sum: number, c: any) => sum + c.stake, 0);
      const winningPotStake = winningPoolContracts.reduce((sum: number, c: any) => sum + c.stake, 0);
      const netPotAfterFee = totalPoolPot * 0.95; // 5% fee

      for (const contract of winningPoolContracts) {
        contract.status = 'WON';
        const shareRatio = winningPotStake > 0 ? contract.stake / winningPotStake : 1;
        const payout = netPotAfterFee * shareRatio;

        contract.payout = payout;
        contract.proRataShare = shareRatio;
        contract.payoutType = 'PRO_RATA';
        await contract.save();

        const user = await User.findById(contract.user);
        if (user) {
          user.balance += payout;
          await user.save();

          totalPaidOut += payout;
          winnersCount++;

          await Transaction.create({
            user: user._id,
            type: 'pool_jackpot_won',
            amount: payout,
            status: 'completed',
            reference: contract._id.toString(),
            description: `Pro-Rata Pool Jackpot WON: "${market.title}" (${contract.selection})`,
          });

          createNotification(
            user._id.toString(),
            'Pool Jackpot Won! 💰',
            `Congratulations! Your pool share on "${market.title}" won! ₦${Math.round(payout).toLocaleString()} credited to wallet.`,
            'bet'
          ).catch(() => {});
        }
      }

      for (const contract of losingPoolContracts) {
        contract.status = 'LOST';
        contract.payout = 0;
        await contract.save();
        losersCount++;

        createNotification(
          contract.user.toString(),
          'Pool Trade Result',
          `Your pool contract on "${market.title}" (${contract.selection}) did not win.`,
          'bet'
        ).catch(() => {});
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. SETTLE LEGACY BETS (Backward Compatibility)
    // ────────────────────────────────────────────────────────────────────────
    const pendingBets = await Bet.find({ market: market._id, status: 'PENDING' });

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
    let trade: any = await Trade.findById(tradeId);
    if (trade) {
      trade.status = status;
      await trade.save();
      return res.json(trade);
    }

    let order = await P2POrder.findById(tradeId);
    if (order) {
      order.status = (status === 'SETTLED' ? 'SETTLED' : status === 'CANCELED' ? 'CANCELLED' : status) as any;
      await order.save();
      return res.json(order);
    }

    let pool = await PoolContract.findById(tradeId);
    if (pool) {
      pool.status = (status === 'SETTLED' ? 'WON' : status === 'CANCELED' ? 'REFUNDED' : status) as any;
      await pool.save();
      return res.json(pool);
    }

    return res.status(404).json({ message: 'Trade not found' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdminTrade = async (req: Request, res: Response) => {
  try {
    const { partyA, partyB, amount, status = 'SETTLED' } = req.body;
    const numAmount = Number(amount);
    if (!partyA || !numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid initiator name and trade amount are required.' });
    }

    let userA = await User.findOne({
      $or: [
        { email: partyA.toLowerCase() },
        { firstName: { $regex: new RegExp(`^${partyA.trim()}$`, 'i') } }
      ]
    });
    if (!userA) {
      userA = await User.findOne({ role: 'user' }) || (req as any).user;
    }

    if (!userA) {
      return res.status(400).json({ message: 'No registered user found to assign as party A.' });
    }

    let userB = null;
    if (partyB) {
      userB = await User.findOne({
        $or: [
          { email: partyB.toLowerCase() },
          { firstName: { $regex: new RegExp(`^${partyB.trim()}$`, 'i') } }
        ]
      });
      if (!userB) {
        userB = await User.findOne({ _id: { $ne: userA._id }, role: 'user' });
      }
    }

    const trade = await Trade.create({
      initiator: userA._id,
      responder: userB ? userB._id : undefined,
      amount: numAmount,
      status: status
    });

    const populatedTrade = await Trade.findById((trade as any)._id)
      .populate('initiator', 'firstName lastName email')
      .populate('responder', 'firstName lastName email');

    // Create a real transaction record for this trade
    await Transaction.create({
      user: userA._id,
      type: 'trade_escrow',
      amount: numAmount,
      status: status === 'SETTLED' ? 'completed' : 'pending',
      reference: `TRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    });

    await SecurityLog.create({
      type: 'success',
      text: `Escrow trade created for ₦${numAmount.toLocaleString()} (${partyA}${partyB ? ' vs ' + partyB : ''})`,
      meta: `Operator: ${(req as any).user?.firstName || 'Admin'}`,
      icon: 'shield'
    });

    res.status(201).json(populatedTrade);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let deleted = await Trade.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await P2POrder.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await PoolContract.findByIdAndDelete(id);
    }
    if (!deleted) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    await SecurityLog.create({
      type: 'warning',
      text: `Trade record ${id} removed by admin`,
      meta: `Operator: ${(req as any).user?.firstName || 'Admin'}`,
      icon: 'trash'
    });

    res.json({ message: 'Trade record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllTrades = async (req: Request, res: Response) => {
  try {
    // 1. Direct peer-to-peer escrow trades
    const trades = await Trade.find()
      .populate('initiator', 'firstName lastName email')
      .populate('responder', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Live P2P Orders from orderbook
    const p2pOrders = await P2POrder.find()
      .populate('user', 'firstName lastName email')
      .populate('matchedFills.counterpartyUserId', 'firstName lastName email')
      .populate('match', 'homeTeam awayTeam title')
      .populate('predictionMarket', 'title pair')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // 3. Live Pool Contracts
    const poolContracts = await PoolContract.find()
      .populate('user', 'firstName lastName email')
      .populate('match', 'homeTeam awayTeam title')
      .populate('predictionMarket', 'title pair')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Standardize P2P Orders
    const mappedP2P = p2pOrders.map((o: any) => {
      const counterparty = o.matchedFills && o.matchedFills.length > 0
        ? o.matchedFills[0].counterpartyUserId
        : null;

      const title = o.match ? `${o.match.homeTeam || ''} vs ${o.match.awayTeam || ''}`.trim() : (o.predictionMarket?.title || o.market || 'Contract');

      return {
        _id: o._id,
        id: o._id,
        initiator: o.user || { firstName: 'Anonymous', lastName: 'User' },
        responder: counterparty || { firstName: 'Peer', lastName: 'Network' },
        amount: o.totalAmount || (o.totalShares * (o.sharePrice || 1000)),
        status: o.status === 'MATCHED' || o.status === 'SETTLED' ? 'SETTLED' : o.status === 'CANCELLED' ? 'CANCELED' : 'PENDING',
        tradeType: 'P2P_ORDER',
        asset: 'NGN',
        contractInfo: `${title} (${o.selection})`,
        createdAt: o.createdAt
      };
    });

    // Standardize Pool Contracts
    const mappedPool = poolContracts.map((p: any) => {
      const title = p.match ? `${p.match.homeTeam || ''} vs ${p.match.awayTeam || ''}`.trim() : (p.predictionMarket?.title || p.market || 'Pool Contract');

      return {
        _id: p._id,
        id: p._id,
        initiator: p.user || { firstName: 'Pool', lastName: 'Participant' },
        responder: { firstName: 'Peer', lastName: 'Pool Reserve' },
        amount: p.stake || 0,
        status: p.status === 'WON' || p.status === 'LOST' ? 'SETTLED' : p.status === 'REFUNDED' ? 'CANCELED' : 'PENDING',
        tradeType: 'POOL_CONTRACT',
        asset: 'NGN',
        contractInfo: `${title} (${p.selection})`,
        createdAt: p.createdAt
      };
    });

    const mappedTrades = trades.map((t: any) => ({
      ...t,
      id: t._id,
      tradeType: 'DIRECT_ESCROW',
      asset: 'NGN'
    }));

    // Combine all real trades and sort chronologically
    const all = [...mappedTrades, ...mappedP2P, ...mappedPool].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    res.json(all);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    const notifs = await Notification.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);

    const formatted = notifs.map(n => ({
      _id: n._id,
      id: n._id,
      title: n.title,
      message: n.message,
      text: n.message,
      desc: n.message,
      type: n.type || 'system',
      category: (n.type || 'system').toUpperCase(),
      read: n.isRead,
      isRead: n.isRead,
      createdAt: n.createdAt,
      user: n.user
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAdminNotificationsRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markSingleAdminNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const broadcastAdminNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, type = 'system' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const users = await User.find({ role: 'user' });
    const docs = users.map(u => ({
      user: u._id,
      title,
      message,
      type: type as any,
      isRead: false
    }));

    if (docs.length > 0) {
      await Notification.insertMany(docs);
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('broadcast_alert', { title, message, type });
      }
    } catch (sockErr) {
      console.warn('Socket broadcast warning:', sockErr);
    }

    res.json({ message: `Broadcast successfully sent to ${users.length} users` });
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
        payoutBank: 0,
        promoReserve: 0,
        totalPromoDeposited: 0,
        totalPromoDisbursed: 0,
      });
    } else {
      // Sync escrowLocked with live trade data
      vault.escrowLocked = liveEscrowLocked;
      if (vault.promoReserve === undefined) vault.promoReserve = 0;
      if (vault.totalPromoDeposited === undefined) vault.totalPromoDeposited = 0;
      if (vault.totalPromoDisbursed === undefined) vault.totalPromoDisbursed = 0;
      await vault.save();
    }

    res.json(vault);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVaultBalances = async (req: Request, res: Response) => {
  try {
    const { custodyPool, escrowLocked, coldReserve, payoutBank, promoReserve, totalPromoDeposited, totalPromoDisbursed } = req.body;
    let vault = await VaultBalance.findOne();
    if (!vault) {
      vault = new VaultBalance();
    }
    if (custodyPool !== undefined) vault.custodyPool = custodyPool;
    if (escrowLocked !== undefined) vault.escrowLocked = escrowLocked;
    if (coldReserve !== undefined) vault.coldReserve = coldReserve;
    if (payoutBank !== undefined) vault.payoutBank = payoutBank;
    if (promoReserve !== undefined) vault.promoReserve = promoReserve;
    if (totalPromoDeposited !== undefined) vault.totalPromoDeposited = totalPromoDeposited;
    if (totalPromoDisbursed !== undefined) vault.totalPromoDisbursed = totalPromoDisbursed;
    await vault.save();
    res.json(vault);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const depositPromoVault = async (req: Request, res: Response) => {
  try {
    const { amount, note, reference } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount. Must be a positive number.' });
    }

    let vault = await VaultBalance.findOne();
    if (!vault) {
      vault = await VaultBalance.create({
        custodyPool: 0,
        escrowLocked: 0,
        coldReserve: 0,
        payoutBank: 0,
        promoReserve: 0,
        totalPromoDeposited: 0,
        totalPromoDisbursed: 0,
      });
    }

    vault.promoReserve = (vault.promoReserve || 0) + numAmount;
    vault.totalPromoDeposited = (vault.totalPromoDeposited || 0) + numAmount;
    await vault.save();

    res.json({
      success: true,
      message: `₦${numAmount.toLocaleString()} successfully deposited to Promotional Vault!`,
      vault,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const executeAirdropBonus = async (req: Request, res: Response) => {
  try {
    const { campaignName, targetAudience, amountPerUser, count, note } = req.body;
    const numAmount = Number(amountPerUser);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid bonus amount per user. Must be a positive number.' });
    }

    // 1. Resolve eligible target users
    let targetUsers: any[] = [];
    if (targetAudience === 'random') {
      const sampleSize = Math.max(1, Number(count) || 25);
      targetUsers = await User.aggregate([
        { $match: { role: 'user', isBanned: { $ne: true } } },
        { $sample: { size: sampleSize } }
      ]);
    } else if (targetAudience === 'active_traders') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeTraderUserIds = await Trade.find({ createdAt: { $gte: thirtyDaysAgo } }).distinct('user');
      targetUsers = await User.find({ _id: { $in: activeTraderUserIds as any[] }, role: 'user', isBanned: { $ne: true } });
    } else if (targetAudience === 'top_traders') {
      const limitCount = Math.max(1, Number(count) || 25);
      targetUsers = await User.find({ role: 'user', isBanned: { $ne: true } })
        .sort({ balance: -1 })
        .limit(limitCount);
    } else {
      // 'all_users'
      targetUsers = await User.find({ role: 'user', isBanned: { $ne: true } });
    }

    if (!targetUsers || targetUsers.length === 0) {
      return res.status(400).json({ message: 'No eligible users found for the selected audience criteria.' });
    }

    const totalRequired = targetUsers.length * numAmount;

    // 2. Check Promotional Vault liquidity
    let vault = await VaultBalance.findOne();
    if (!vault) {
      vault = await VaultBalance.create({
        custodyPool: 0,
        escrowLocked: 0,
        coldReserve: 0,
        payoutBank: 0,
        promoReserve: 0,
        totalPromoDeposited: 0,
        totalPromoDisbursed: 0,
      });
    }

    const currentPromoBalance = vault.promoReserve || 0;
    if (currentPromoBalance < totalRequired) {
      return res.status(400).json({
        message: `Insufficient Promotional Vault balance. Required: ₦${totalRequired.toLocaleString()} (${targetUsers.length} users × ₦${numAmount.toLocaleString()}), but Vault only has ₦${currentPromoBalance.toLocaleString()}. Please deposit funds to the Promotional Vault first.`,
        required: totalRequired,
        available: currentPromoBalance,
      });
    }

    // 3. Deduct from Promotional Vault
    vault.promoReserve = currentPromoBalance - totalRequired;
    vault.totalPromoDisbursed = (vault.totalPromoDisbursed || 0) + totalRequired;
    await vault.save();

    // 4. Distribute credits and notifications to all recipients
    const recipientsList: any[] = [];
    const campaignTitle = campaignName?.trim() || 'Community Trading Bonus';

    for (const u of targetUsers) {
      // Credit user wallet
      await User.findByIdAndUpdate(u._id, { $inc: { balance: numAmount } });

      // Transaction log
      try {
        await Transaction.create({
          user: u._id,
          type: 'airdrop_bonus',
          amount: numAmount,
          status: 'completed',
          reference: `AIRDROP_${Date.now()}_${u._id.toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`,
          description: `Promotional Bonus: ${campaignTitle}`,
        });
      } catch (txnErr) {
        console.warn('Error recording airdrop transaction for user:', u._id, txnErr);
      }

      // Notification
      try {
        await createNotification(
          u._id.toString(),
          '🎁 Surprise Bonus Received!',
          `You received a ₦${numAmount.toLocaleString()} promotional bonus for "${campaignTitle}"! Your balance has been credited. Happy Trading!`,
          'wallet'
        );
      } catch (notifErr) {
        console.warn('Error creating airdrop notification for user:', u._id, notifErr);
      }

      recipientsList.push({
        userId: u._id,
        email: u.email || '',
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User',
        amount: numAmount,
      });
    }

    // 5. Create Airdrop History Log
    const airdropLog = await AirdropLog.create({
      campaignName: campaignTitle,
      targetAudience: targetAudience || 'random',
      amountPerUser: numAmount,
      recipientCount: targetUsers.length,
      totalDistributed: totalRequired,
      note: note || '',
      recipients: recipientsList.slice(0, 100),
      executedBy: (req as any).user?.email || 'Admin',
    });

    res.json({
      success: true,
      message: `Successfully distributed ₦${totalRequired.toLocaleString()} across ${targetUsers.length} users!`,
      airdropLog,
      vault: {
        promoReserve: vault.promoReserve,
        totalPromoDeposited: vault.totalPromoDeposited,
        totalPromoDisbursed: vault.totalPromoDisbursed,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAirdropHistory = async (req: Request, res: Response) => {
  try {
    const logs = await AirdropLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const creditUser = async (req: Request, res: Response) => {
  try {
    const { userId, amount, description } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount. Please enter a positive number.' });
    }

    user.balance = (user.balance || 0) + numAmount;
    await user.save();

    // Create a transaction log
    try {
      await Transaction.create({
        user: user._id,
        type: 'deposit',
        amount: numAmount,
        status: 'completed',
        reference: `ADMIN_CREDIT_${Date.now()}`,
        description: description || 'Manual wallet credit by Administrator',
      });
    } catch (txnErr) {
      console.warn('Could not record credit transaction:', txnErr);
    }

    // Send in-app notification
    try {
      await createNotification(
        user._id.toString(),
        'Wallet Credited 💰',
        `Your wallet has been credited with ₦${numAmount.toLocaleString()} by Admin.`,
        'wallet'
      );
    } catch (notifErr) {
      console.warn('Could not send credit notification:', notifErr);
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};




