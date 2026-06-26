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
  checkAvailability,
  uploadKycDocument,
  updatePin,
  changePassword,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import { upload } from '../config/cloudinary';
import User from '../models/User';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/check-availability', checkAvailability);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', checkResetOtp);
router.put('/profile', protect, updateProfile);
router.post('/profile/image', protect, upload.single('image'), uploadProfileImage);
router.post('/profile/kyc', protect, upload.single('document'), uploadKycDocument);
router.put('/profile/pin', protect, updatePin);
router.put('/profile/password', protect, changePassword);
router.get('/me', protect, async (req: any, res: Response) => {
  // Fetch user again to include pin (since it's select: false)
  const user = await User.findById(req.user._id).select('+pin');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const userObj = { ...user.toJSON() };
  userObj.hasPin = !!user.pin;
  delete userObj.pin; // Ensure pin is never sent to the client
  res.json(userObj);
});

export default router;
