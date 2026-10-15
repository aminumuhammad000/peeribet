import express from 'express';
import { 
  provisionVirtualAccount, 
  getVirtualAccount, 
  vtStackWebhook,
  listBanks,
  verifyBank,
  requestWithdrawal,
  initializeFlutterwaveDeposit,
  verifyFlutterwaveDeposit,
  flutterwaveWebhook
} from '../controllers/walletController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public — webhooks (must be before protect middleware)
router.post('/webhook/vtstack', vtStackWebhook);
router.post('/webhook/flutterwave', flutterwaveWebhook);

// Protected — user wallet routes
router.get('/virtual-account', protect, getVirtualAccount);
router.post('/virtual-account', protect, provisionVirtualAccount);

// Protected — Flutterwave standard checkout routes
router.post('/flutterwave/initialize', protect, initializeFlutterwaveDeposit);
router.get('/flutterwave/verify/:txRef', protect, verifyFlutterwaveDeposit);

router.get('/banks', protect, listBanks);
router.get('/banks/verify', protect, verifyBank);
router.post('/withdraw', protect, requestWithdrawal);

export default router;
