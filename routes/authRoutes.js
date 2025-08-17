import express from "express";
import {signUp, logIn,logOut, sendVerificationCode, verifyVerificationCode, changePassword,sendForgetPasswordCode,verifyForgetPasswordCode} from "../controllers/authController.js";
import identifier from "../middlewares/identification.js";
const router = express.Router();

router.post('/register',signUp);
router.patch('/register/send-verification-code', identifier,sendVerificationCode);
router.patch('/register/verify-verification-code',identifier, verifyVerificationCode);

router.post('/login', logIn);
router.post('/logout', identifier,logOut);


router.patch('/change-password',identifier, changePassword);
router.patch('/reset-password/send-forgetPassword-code', sendForgetPasswordCode);
router.patch('/reset-password/verify-forgetPassword-code', verifyForgetPasswordCode);

export default router;