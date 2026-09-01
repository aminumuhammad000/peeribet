import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { createOrder, getMatchOrderBook, getMyOrders, cancelOrder } from '../controllers/p2pController';

const router = Router();

router.post('/orders', protect, createOrder);
router.get('/orderbook/:matchId', getMatchOrderBook);
router.get('/my-orders', protect, getMyOrders);
router.post('/cancel/:orderId', protect, cancelOrder);

export default router;
