import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { getMyBridgeOffers, acceptOffer } from '../controllers/bridgeController';

const router = Router();

router.get('/pending-offers', protect, getMyBridgeOffers);
router.post('/accept/:orderId', protect, acceptOffer);

export default router;
