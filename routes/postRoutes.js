
import express from "express";
import {createPost, getAllPosts, getPostsByUserId, updatePost, deletePost} from "../controllers/postController.js";
import authenticateUser from "../middlewares/authenticateUser.js";

const router = express.Router();

router.post("/create",authenticateUser, createPost);
router.put("/update/:id", authenticateUser,updatePost);
router.get("/getPosts",authenticateUser, getPostsByUserId);
router.get("/getAllPosts", authenticateUser,getAllPosts);
router.delete("/delete/:id", authenticateUser,deletePost);

export default router;