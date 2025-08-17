import {signUpValidator, acceptCodeSchema,changePasswordSchema,acceptFPCodeSchema,forgetPasswordValidator} from "../middlewares/signupValidator.js";
import loginValidator from "../middlewares/loginValidator.js";
import  User from "../models/userModel.js";
import hash from "../Utils/hashing.js";
import jwt from "jsonwebtoken";
import sendMail from "../middlewares/sendMail.js";
/**
 * Handles user registration
 * 1. Validates input using Joi
 * 2. Checks for existing email
 * 3. Creates new user
 */
let signUp = async (req, res) => {
    try {
        // 1. Validate request body
        const { error } = signUpValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message 
            });
        }

        // 2. Check for duplicate email
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ // 409 Conflict is more appropriate
                error: 'Email already registered' 
            });
        }

        //hashing password

        const hashedPassword = await hash.hashData(req.body.password);
        req.body.password = hashedPassword;

        // 3. Creating new user
        const user = new User(req.body);
        await user.save();
        
        // 4. Return response (excluding sensitive data)
        res.status(201).json({ // 201 Created for successful creation
            _id: user._id,
            name: user.name,
            email: user.email,
            verified: user.verified
        });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ 
            error: 'Registration failed. Please try again.' 
        });
    }
}

/**
 * Handles user login
 * 1. Finds user by email
 * 2. Validates credentials
 * 3. Returns user data (without password)
 */
const logIn = async (req, res) => {
    try {
        // 1. Input validation
        const { error } = loginValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message 
            });
        }

        // 2. Find user with credentials
        const user = await User.findOne({ email: req.body.email.trim() })
                             .select('+password +verified');
        
        if (!user) {
            return res.status(401).json({
                error: 'Invalid Email' // Keep generic for security
            });
        }

        // 3. Email verification check
        if (!user.verified) {
            return res.status(403).json({
                error: 'Please verify your email before logging in'
            });
        }

        // 4. Password validation
        const isMatch = await hash.compareData(req.body.password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid Password' // Same message as email check
            });
        }

        // 5. Token generation
       // In your login controller
// Where you create the token (login/signup)
console.log('Creating token with payload:', {
  userId: user._id,
  verified: user.verified
});

const token = jwt.sign(
  {
    userId: user._id.toString() // Explicit conversion
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

        // 6. Set secure cookie
        res.cookie('token', token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            httpOnly: true, // Always httpOnly for security
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' // CSRF protection
        });

        // 7. Final response
        res.status(200).json({
            token,
            name: user.name,
            email: user.email,
            verified: user.verified
            // Don't send token in body if using cookies
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            error: 'Authentication service unavailable' 
        });
    }
};

const logOut = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' , });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};


const sendVerificationCode = async (req, res) => {
    try {
        // 1. Input validation
        const { error } = loginValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message 
            });
        }

        const email = req.body.email.trim();

        // 2. Find user
        const user = await User.findOne({ email }).select('+verified');
        if (!user) {
            // Security: Generic response regardless of email existence
            return res.status(200).json({
                message: 'If this email exists, a verification code has been sent'
            });
        }

        // 3. Skip if already verified
        if (user.verified) {
            return res.status(409).json({
                error: 'Email is already verified'
            });
        }

        // 4. Generate secure verification code with HMAC
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hmacSignature = await hash.generateHMAC(
            verificationCode, 
            process.env.HMAC_SECRET
        );

        // 5. Save with expiration (15 minutes)
        user.verificationCode = verificationCode;
        user.verificationCodeValidation = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        // 6. Send verification email
        const emailResult = await sendMail(
            user.email,
            'Your Verification Code',
            `Your verification code is: ${verificationCode}\nCode expires in 15 minutes.`,
            `
                <div>
                    <h2>Your Verification Code</h2>
                    <p style="font-size: 18px; font-weight: bold;">
                        ${verificationCode}
                    </p>
                    <p>This code expires in 15 minutes.</p>
                    <p>Or verify at: ${process.env.BASE_URL}/verify</p>
                </div>
            `
        );

        if (!emailResult || !emailResult.success) {
            throw new Error('Failed to send verification email');
        }

        // 7. Respond successfully
        res.status(200).json({
            message: 'Verification code sent',
            expiresIn: '15 minutes'
        });

    } catch (error) {
        console.error('Verification Error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? `Verification failed: ${error.message}`
                : 'Could not process verification request'
        });
    }
};
const verifyVerificationCode = async (req, res) => {
    const { email, verificationCode } = req.body;
    
    try {
        // 1. Input validation
        const { error } = acceptCodeSchema.validate({ email, verificationCode });
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message,
                ...(process.env.NODE_ENV === 'development' && { details: error.details })
            });
        }

        // 2. Find user with verification data
        const user = await User.findOne({ email })
            .select('+verificationCode +verificationCodeValidation +verified');
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Account not found' 
            });
        }

        // 3. Check verification status
        if (user.verified) {
            return res.status(409).json({ 
                error: 'Email is already verified',
                verifiedAt: user.updatedAt
            });
        }

        // 4. Verify all code conditions
        const codeValue = verificationCode.toString();
        const currentTime = new Date();
        
        if (!user.verificationCode) {
            return res.status(400).json({ error: 'No pending verification found' });
        }

        if (user.verificationCode !== codeValue) {
            return res.status(401).json({ error: 'Invalid verification code' });
        }

        if (new Date(user.verificationCodeValidation) < currentTime) {
            return res.status(410).json({ error: 'Verification code expired' });
        }

        // 5. Mark as verified and clean up
        user.verified = true;
        user.verifiedAt = currentTime;
        user.verificationCode = undefined;
        user.verificationCodeValidation = undefined;
        await user.save();

        // 6. Generate auth token (optional)
        const authToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 7. Success response
        res.status(200).json({
            message: 'Email verified successfully',
            authToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Verification Error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? `Verification failed: ${error.message}`
                : 'Could not complete verification'
        });
    }
};

    const changePassword = async (req, res) => {
    try {
        // Debugging: Verify incoming user object
        console.log('Request User:', req.user);
        
        const userId = req.user.userId;
        console.log('User ID:', userId);

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { oldPassword, newPassword } = req.body;
        
        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Both passwords are required' });
        }

        // Find user with password explicitly selected
        const user = await User.findById(req.user.userId).select('+password');
        console.log('Found User:', user); // Debug
        
        if (!user) {
            return res.status(404).json({ error: 'User account not found' });
        }

        // Verify password exists
        if (!user.password) {
            return res.status(400).json({ 
                error: 'This account has no password set' 
            });
        }

        // Compare passwords
        const isMatch = await hash.compareData(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        user.password = await hash.hashData(newPassword);
        user.passwordChangedAt = Date.now();
        await user.save();

        // Optional: Invalidate old tokens
        res.clearCookie('token');

        return res.status(200).json({ 
            message: 'Password updated successfully',
            // Optionally return a new token
            token: jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            )
        });

    } catch (error) {
        console.error('Password Change Error:', error);
        return res.status(500).json({ 
            error: 'Password update failed',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
};


const sendForgetPasswordCode = async (req, res) => {
    try {
        // 1. Validate input
        const { error } = forgetPasswordValidator.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message 
            });
        }
        const email = req.body.email.trim();

        // 2. Find user
        const user = await User.findOne({ email }).select('+verified');
        if (!user) {
            // Security: Generic response regardless of email existence
            return res.status(200).json({
                message: 'If this email exists, a password reset code has been sent'
            });
        }

        // 3. Generate secure 6-digit code
        const forgetPasswordCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hmacSignature = await hash.generateHMAC(
            forgetPasswordCode, 
            process.env.HMAC_SECRET
        );

        // 4. Save with expiration (15 minutes)
        user.forgetPasswordCode = forgetPasswordCode;
        user.forgetPasswordCodeValidation = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        // 5. Send password reset email
        const emailResult = await sendMail(
            user.email,
            'Your Password Reset Code',
            `Your password reset code is: ${forgetPasswordCode}\nCode expires in 15 minutes.`,
            `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Here's your verification code:</p>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                            ${forgetPasswordCode}
                        </p>
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this, please ignore this email or contact support.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #777;">
                        For security reasons, please don't share this code with anyone.
                    </p>
                </div>
            `
        );

        if (!emailResult?.success) {
            throw new Error('Failed to send password reset email');
        }

        // 6. Respond successfully
        res.status(200).json({
            success: true,
            message: 'Password reset code sent',
            expiresIn: '15 minutes',
            // Don't send the code in response for security
        });

    } catch (error) {
        console.error('Password Reset Error:', {
            error: error.message,
            endpoint: 'sendForgetPasswordCode',
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === 'development'
                ? `Password reset failed: ${error.message}`
                : 'Could not process password reset request'
        });
    }
};


const verifyForgetPasswordCode = async (req, res) => {
    console.log(req.body);
    const { email, forgetPasswordCode, newPassword } = req.body;
    
    try {
       
        const { error } = acceptFPCodeSchema.validate(req.body         
       );
        
        if (error) {
            return res.status(400).json({ 
                success: false,
                error: error.details[0].message,
                ...(process.env.NODE_ENV === 'development' && { details: error.details })
            });
        }

        // 2. Find user with password reset data
        const user = await User.findOne({ email: email })
            .select('+forgetPasswordCode +forgetPasswordCodeValidation +password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Account not found' 
            });
        }

        // 3. Verify code exists
        if (!user.forgetPasswordCode) {
            return res.status(400).json({ 
                success: false,
                error: 'No password reset request found for this email' 
            });
        }

        // 4. Verify code matches
        if (user.forgetPasswordCode !== forgetPasswordCode) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid password reset code' 
            });
        }

        // 5. Check code expiration
        const currentTime = new Date();
        if (currentTime > user.forgetPasswordCodeValidation) {
            // Clean up expired code
            user.forgetPasswordCode = undefined;
            user.forgetPasswordCodeValidation = undefined;
            await user.save();

            return res.status(410).json({ 
                success: false,
                error: 'Password reset code has expired' 
            });
        }

        // 6. Verify new password is different from old
        const isSamePassword = await hash.compareData(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'New password must be different from current password'
            });
        }

        // 7. Update password and clear reset fields
        user.password = await hash.hashData(newPassword);
        user.passwordChangedAt = currentTime;
        user.forgetPasswordCode = undefined;
        user.forgetPasswordCodeValidation = undefined;
        await user.save();

        // 8. Invalidate existing sessions (optional)
        // user.sessionVersion = (user.sessionVersion || 0) + 1;
        // await user.save();

        // 9. Generate new auth token
        const authToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 10. Clear any existing token cookies
        res.clearCookie('token');

        // 11. Success response
        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            authToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Password Reset Error:', {
            error: error.message,
            endpoint: 'verifyForgetPasswordCode',
            timestamp: new Date().toISOString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === 'development'
                ? `Password reset failed: ${error.message}`
                : 'Could not complete password reset'
        });
    }
};

export { signUp, logIn,logOut, sendVerificationCode, verifyVerificationCode, changePassword,sendForgetPasswordCode,verifyForgetPasswordCode};