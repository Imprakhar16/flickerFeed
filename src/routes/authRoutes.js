import express from 'express';


import { googleAuthenticate, googleLogin, loginUser, logout, registerUser } from '../controllers/authController.js';

const router = express.Router();


router.post('/register',registerUser );

router.post('/login',loginUser);


router.get('/google', googleLogin);


router.get('/google/callback',googleAuthenticate);


router.get('/logout',logout );

export default router;
