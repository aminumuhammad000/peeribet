import express from 'express';
import { placeBet, getMyBets } from '../controllers/betController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', protect, placeBet);
router.get('/my-bets', protect, getMyBets);

export default router;
