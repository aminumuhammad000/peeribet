import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Trade from '../models/Trade';
import Market from '../models/Market';
import SystemSetting from '../models/SystemSetting';
import SecurityLog from '../models/SecurityLog';
import VaultBalance from '../models/VaultBalance';
import bcrypt from 'bcryptjs';

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
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
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
    await user.save();
    res.json({ message: `KYC status updated to ${status}` });
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
    const markets = await Market.find().sort({ createdAt: -1 });
    res.json(markets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMarket = async (req: Request, res: Response) => {
  try {
    const { pair, rate, change, volume, status } = req.body;
    const market = await Market.create({ pair, rate, change, volume, status });
    res.json(market);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMarketStatus = async (req: Request, res: Response) => {
  try {
    const { marketId, status } = req.body;
    const market = await Market.findById(marketId);
    if (!market) return res.status(404).json({ message: 'Market not found' });
    market.status = status;
    await market.save();
    res.json(market);
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
    const { oldPassword, newPassword } = req.body;
    const adminUser = await User.findById((req as any).user._id);
    if (!adminUser) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(oldPassword, adminUser.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid current password' });

    adminUser.password = newPassword; // Will be hashed by pre-save hook in User model
    await adminUser.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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




