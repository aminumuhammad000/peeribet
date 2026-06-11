import express from 'express';
import { getMatches, getMatchById } from '../controllers/matchController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', protect, getMatches);
router.get('/:id', protect, getMatchById);

export default router;
