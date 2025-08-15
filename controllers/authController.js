import signupValidator from "../middlewares/signupValidator.js";
import loginValidator from "../middlewares/loginValidator.js";
import User from "../models/userModel.js";
import hash from "../Utils/hashing.js";

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

        const hashedPassword = await hash.hashPassword(req.body.password);
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
        const isMatch = await hash.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid Password' // Same message as email check
            });
        }

        // 5. Token generation
        const token = jwt.sign(
            { 
                _id: user._id,
                role: user.role // Add if you have roles
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
            _id: user._id,
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
export { signUp, logIn };