import express from 'express';
import upload from '../middlewares/upload.js';

import { googleAuthenticate, googleLogin, loginUser, logout, registerUser, resendOTP, verifyOtp } from '../controllers/authController.js';

const router = express.Router();


router.post('/register', upload.single("profilePhoto"),registerUser );

router.post('/login',loginUser);


router.get('/google', googleLogin);
router.post('/verify-otp',verifyOtp)
router.post('/resend-otp',resendOTP)
router.get('/google/callback',googleAuthenticate);


router.get('/logout',logout );

export default router;
