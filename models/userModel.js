import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        // Basic user information
        name: {
            type: String,
            required: [true, "Please add a name"],
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: [true, "Email already exists"], // Ensures no duplicate emails
            trim: true, // Removes whitespace from email
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            trim: true,
            minLength: [6, "Password must be at least 8 characters"],
            select: false, // Never returned in queries by default (security)
        },

        // Email verification system
        verified: {
            type: Boolean,
            default: false, // Becomes true after email verification
        },
        verificationCode: {
            type: String,
            select: false, // Hidden from queries (security)
            // Why stored? To compare against code user submits during verification
        },
        verificationCodeValidation: {
            type: Date,
            select: false,
            // Why stored? To check if verification code has expired (typically 24h)
        },

        // Password reset system
        forgetPasswordCode: {
            type: String,
            select: false,
            // Why stored? Temporary code sent via email for password resets
        },
        forgetPasswordCodeValidation: {
            type: Number, // Should actually be Date (timestamp)
            select: false,
            // Why stored? To check if reset code has expired (typically 1h)
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

const User = mongoose.model("User", userSchema);
export default User;