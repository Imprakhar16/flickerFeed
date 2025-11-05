import express from 'express';
import upload from '../middlewares/upload.js';

import { googleAuthenticate, googleLogin, loginUser, logout, registerUser } from '../controllers/authController.js';

const router = express.Router();


router.post('/register', upload.single("profilePhoto"),registerUser );

router.post('/login',loginUser);


router.get('/google', googleLogin);


router.get('/google/callback',googleAuthenticate);


router.get('/logout',logout );

export default router;
