import express from 'express';
import { createTicket, getMyTickets } from '../controllers/supportController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getMyTickets);

export default router;
