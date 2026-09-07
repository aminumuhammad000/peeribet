import express from 'express';
import { getPublicMarkets, getMarketById, placeMarketBet } from '../controllers/marketController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', getPublicMarkets);
router.get('/:id', getMarketById);
router.post('/:id/bet', protect, placeMarketBet);

export default router;
