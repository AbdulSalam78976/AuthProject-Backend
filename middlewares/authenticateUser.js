// authMiddleware.js
import jwt from 'jsonwebtoken';

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure we have a user ID in the token
        if (!decoded.userId) {
            throw new Error('Invalid token payload');
        }

        // Standardize the user object
        req.user = { 
            userId: decoded.userId.toString() // Force string conversion
        };
        
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        // ... (keep your existing error handling)
    }
};

export default authenticateUser;