import express from 'express';
import { getTransactionHistory, deposit, withdraw } from '../controllers/transactionController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect); // All transaction routes are protected

router.get('/', getTransactionHistory);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);

export default router;
