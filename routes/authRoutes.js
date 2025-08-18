import express from "express";
import {signUp, logIn,logOut, sendVerificationCode, verifyVerificationCode, changePassword,sendForgetPasswordCode,verifyForgetPasswordCode} from "../controllers/authController.js";
import authenticateUser from "../middlewares/authenticateUser.js";
const router = express.Router();

router.post('/register',signUp);
router.patch('/register/send-verification-code', authenticateUser,sendVerificationCode);
router.patch('/register/verify-verification-code', authenticateUser, verifyVerificationCode);

router.post('/login', logIn);
router.post('/logout', authenticateUser,logOut);


router.patch('/change-password', authenticateUser, changePassword);
router.patch('/reset-password/send-forgetPassword-code', sendForgetPasswordCode);
router.patch('/reset-password/verify-forgetPassword-code', verifyForgetPasswordCode);

export default router;