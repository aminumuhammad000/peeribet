import express from 'express';
import { 
  provisionVirtualAccount, 
  getVirtualAccount, 
  vtStackWebhook,
  listBanks,
  verifyBank,
  requestWithdrawal
} from '../controllers/walletController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public — webhook from VTStack (must be before protect middleware)
router.post('/webhook/vtstack', vtStackWebhook);

// Protected — user wallet routes
router.get('/virtual-account', protect, getVirtualAccount);
router.post('/virtual-account', protect, provisionVirtualAccount);

router.get('/banks', protect, listBanks);
router.get('/banks/verify', protect, verifyBank);
router.post('/withdraw', protect, requestWithdrawal);

export default router;
