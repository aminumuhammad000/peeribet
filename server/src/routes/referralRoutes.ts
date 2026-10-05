import express from 'express';
import { 
  validateReferralCode, 
  getMyReferrals 
} from '../controllers/referralController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public route to validate a code before/during signup
router.get('/validate/:code', validateReferralCode);

// Protected route for authenticated users to view their referrals and code
router.get('/my-referrals', protect, getMyReferrals);

export default router;
