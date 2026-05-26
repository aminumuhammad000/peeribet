import express, { Response } from 'express';
import { register, login, verifyOtp } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/me', protect, (req: any, res: Response) => {
  res.json(req.user);
});

export default router;
