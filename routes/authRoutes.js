import express from "express";
import {logIn, signUp, logOut, sendVerificationCode,verifyVerificationCode} from "../controllers/authController.js";

const router = express.Router();

router.post('/register',signUp);
router.post('/register/send-verification-code', sendVerificationCode);
router.post('/register/verify-verification-code', verifyVerificationCode);

router.post('/login', logIn);
router.post('/logout', logOut);

export default router;