import express from 'express';
import upload from '../middlewares/upload.js';

import { forgotPassword, googleAuthenticate, googleLogin, loginUser, logout, registerUser, resendOTP, resetPassword, verifyOtp } from '../controllers/authController.js';

const router = express.Router();


router.post('/register', upload.single("profilePhoto"),registerUser );

router.post('/login',loginUser);


router.get('/google', googleLogin);
router.post('/verify-otp',verifyOtp)
router.post('/resend-otp',resendOTP)
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword)
router.get('/google/callback',googleAuthenticate);


router.get('/logout',logout );

export default router;
