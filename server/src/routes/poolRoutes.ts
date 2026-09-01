import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { enterMatchPool, getPoolBreakdown, getMyPoolContracts } from '../controllers/poolController';

const router = Router();

router.post('/enter', protect, enterMatchPool);
router.get('/my-contracts', protect, getMyPoolContracts);
router.get('/:matchId', getPoolBreakdown);

export default router;
