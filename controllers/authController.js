import signupValidator from "../middlewares/signupValidator.js";
import loginValidator from "../middlewares/loginValidator.js";
import User from "../models/userModel.js";
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
        const { error } = signupValidator.validate(req.body);
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
        const token = jwt.sign(
            { 
                _id: user._id,
                //role: user.role // Add if you have roles
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Always set expiration
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

        // 2. Find user
        const user = await User.findOne({ email: req.body.email.trim() });
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
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        const hmacSignature = await hash.generateHMAC(
            verificationCode.toString(), 
            process.env.HMAC_SECRET
        );

        // 5. Save with expiration (15 minutes)
        user.verification = {
            code: verificationCode,
            signature: hmacSignature,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        };
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
        console.error('Verification Error:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? `Verification failed: ${error.message}`
                : 'Could not process verification request'
        });
    }
};
export { signUp, logIn,logOut, sendVerificationCode };