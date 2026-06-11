import express, { Response } from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  checkResetOtp,
  updateProfile,
  uploadProfileImage,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { upload } from '../config/cloudinary';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', checkResetOtp);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);
router.get('/me', protect, (req: any, res: Response) => {
  res.json(req.user);
});

export default router;
