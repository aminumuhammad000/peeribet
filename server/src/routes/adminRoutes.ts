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
  updateMarketStatus,
  getSecurityLogs,
  createSecurityLog,
  updateTradeStatus,
  getAllTrades,
  changeAdminPassword,
  updateAdminProfile,
  updateTransactionStatus,
  getVaultBalances,
  updateVaultBalances,
  creditUser
} from '../controllers/adminController';


import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/users/credit', creditUser);
router.get('/transactions', getAllTransactions);
router.post('/transactions/status', updateTransactionStatus);
router.post('/kyc-verify', updateKycStatus);


router.get('/settings', getSettings);
router.post('/settings', updateSettings);

router.get('/markets', getMarkets);
router.post('/markets', createMarket);
router.post('/markets/status', updateMarketStatus);

router.get('/security-logs', getSecurityLogs);
router.post('/security-logs', createSecurityLog);

router.get('/trades', getAllTrades);
router.post('/trades/status', updateTradeStatus);

router.get('/vaults', getVaultBalances);
router.post('/vaults', updateVaultBalances);

router.post('/change-password', changeAdminPassword);
router.post('/profile', updateAdminProfile);

export default router;

