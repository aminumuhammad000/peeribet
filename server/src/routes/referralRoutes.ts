import express from 'express';
import { 
  validateReferralCode, 
  getMyReferrals,
  claimWinReceiptBonus,
  getWinReceiptShareStatus
} from '../controllers/referralController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public route to validate a code before/during signup
router.get('/validate/:code', validateReferralCode);

// Protected route for authenticated users to view their referrals and code
router.get('/my-referrals', protect, getMyReferrals);

// Win Receipt Sharing Incentive & Anti-Abuse
router.post('/claim-win-share', protect, claimWinReceiptBonus);
router.get('/win-share-status/:tradeId', protect, getWinReceiptShareStatus);

export default router;

