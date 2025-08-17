import express from "express";
import {signUp, logIn,logOut, sendVerificationCode, verifyVerificationCode, changePassword} from "../controllers/authController.js";
import identifier from "../middlewares/identification.js";
const router = express.Router();

router.post('/register',signUp);
router.patch('/register/send-verification-code', identifier,sendVerificationCode);
router.patch('/register/verify-verification-code',identifier, verifyVerificationCode);

router.post('/login', logIn);
router.post('/logout', identifier,logOut);


router.patch('/change-password',identifier, changePassword);

export default router;