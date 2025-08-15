import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cookieParser()); // Parse cookies
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS (adjust for production)

app.use("/api/auth", authRoutes); // Mount auth routes

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose
    .connect(MONGODB_URI, {
       
    })
    .then(() => {
        console.log("Connected to MongoDB");
        // Start the server
        app.listen(process.env.PORT, () => {
            console.log("Server started on port 3000");
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });