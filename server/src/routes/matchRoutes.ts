import express from 'express';
import { getMatches, getMatchById, syncMatches } from '../controllers/matchController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getMatches);
router.post('/sync', protect, syncMatches);
router.get('/:id', protect, getMatchById);

export default router;
