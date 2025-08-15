import express from "express";
import {logIn, signUp, logOut, sendVerificationCode} from "../controllers/authController.js";

const router = express.Router();

router.post('/register',signUp);
router.post('/register/verify', sendVerificationCode);
router.post('/login', logIn);
router.post('/logout', logOut);

export default router;