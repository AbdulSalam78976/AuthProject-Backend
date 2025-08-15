import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import blogRoutes from "./routes/blogRoutes/blogRoutes.js";
import userRoutes from "./routes/userRoutes/userRoutes.js";

dotenv.config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.s)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start server only after MongoDB connection is established
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server started on port ${process.env.PORT || 3000}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });