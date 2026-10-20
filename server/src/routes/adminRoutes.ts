import express from 'express';
import { 
  getDashboardStats, 
  getAllUsers, 
  getAllTransactions, 
  updateKycStatus,
  getSettings,
  updateSettings,
  getMarkets,
  createMarket,
  updateMarket,
  updateMarketStatus,
  toggleMarketLock,
  toggleMatchLock,
  getAllMatchesAdmin,
  publishMarket,
  resolveMarket,
  voidMarket,
  deleteMarket,
  getSecurityLogs,
  createSecurityLog,
  updateTradeStatus,
  getAllTrades,
  createAdminTrade,
  deleteTrade,
  getAdminNotifications,
  markAdminNotificationsRead,
  markSingleAdminNotificationRead,
  deleteAdminNotification,
  broadcastAdminNotification,
  changeAdminPassword,
  resetUserPassword,
  updateAdminProfile,
  updateTransactionStatus,
  getVaultBalances,
  updateVaultBalances,
  depositPromoVault,
  executeAirdropBonus,
  getAirdropHistory,
  creditUser,
  getUserById,
  getPendingKyc,
  triggerSettlement,
  bootstrapAdmin
} from '../controllers/adminController';


import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

// Unprotected route for first-time setup
router.post('/bootstrap', bootstrapAdmin);

// All admin routes are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users/credit', creditUser);
router.post('/users/reset-password', resetUserPassword);
router.get('/transactions', getAllTransactions);
router.post('/transactions/status', updateTransactionStatus);
router.post('/kyc-verify', updateKycStatus);
router.get('/kyc/pending', getPendingKyc);
router.post('/settlement/trigger', triggerSettlement);


router.get('/settings', getSettings);
router.post('/settings', updateSettings);

router.get('/markets', getMarkets);
router.post('/markets', createMarket);
router.put('/markets/:id', updateMarket);
router.post('/markets/status', updateMarketStatus);
router.post('/markets/:id/lock', toggleMarketLock);
router.post('/markets/lock', toggleMarketLock);
router.post('/markets/:id/publish', publishMarket);
router.post('/markets/:id/resolve', resolveMarket);
router.post('/markets/:id/void', voidMarket);
router.delete('/markets/:id', deleteMarket);

router.get('/matches', getAllMatchesAdmin);
router.post('/matches/:id/lock', toggleMatchLock);
router.post('/matches/lock', toggleMatchLock);

router.get('/security-logs', getSecurityLogs);
router.post('/security-logs', createSecurityLog);

router.get('/trades', getAllTrades);
router.post('/trades', createAdminTrade);
router.delete('/trades/:id', deleteTrade);
router.post('/trades/status', updateTradeStatus);

router.get('/notifications', getAdminNotifications);
router.post('/notifications/mark-read', markAdminNotificationsRead);
router.post('/notifications/:id/read', markSingleAdminNotificationRead);
router.delete('/notifications/:id', deleteAdminNotification);
router.post('/notifications/broadcast', broadcastAdminNotification);

router.get('/vaults', getVaultBalances);
router.post('/vaults', updateVaultBalances);
router.post('/vaults/deposit-promo', depositPromoVault);
router.post('/bonuses/airdrop', executeAirdropBonus);
router.get('/bonuses/airdrop/history', getAirdropHistory);

router.post('/change-password', changeAdminPassword);
router.post('/profile', updateAdminProfile);

// Referral administration routes
import { 
  getAdminReferralStats, 
  getAdminReferralSettings, 
  updateAdminReferralSettings 
} from '../controllers/referralController';

router.get('/referrals/stats', getAdminReferralStats);
router.get('/referrals/settings', getAdminReferralSettings);
router.post('/referrals/settings', updateAdminReferralSettings);
router.put('/referrals/settings', updateAdminReferralSettings);

export default router;

