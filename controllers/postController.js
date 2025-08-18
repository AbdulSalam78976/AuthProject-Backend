import Post from '../models/postModel.js';
import mongoose from 'mongoose';

// Helper function for error handling
const handleError = (res, error, defaultMessage) => {
    console.error('Error:', error);
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    const message = error.message || defaultMessage;
    res.status(statusCode).json({ 
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

const createPost = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.title || !req.body.content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required'
            });
        }

        // Create new post
        const post = new Post({
            title: req.body.title,
            content: req.body.content,
            image: req.body.image || null,
            authorId: req.user.userId
        });

        const savedPost = await post.save();
        
        res.status(201).json({
            success: true,
            data: savedPost
        });

    } catch (error) {
        handleError(res, error, 'Failed to create post');
    }
};

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination info
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('authorId', 'username email'); // Example of populating author info

        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        handleError(res, error, 'Failed to fetch posts');
    }
};

const getPostsByUserId = async (req, res) => {
    try {
        // Get the authenticated user's ID from the request
        const userId = req.user.userId;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID'
            });
        }

        // Find all posts by this user
        const posts = await Post.find({ authorId: userId })
            .populate('authorId', 'username email')
            .sort({ createdAt: -1 }); // Sort by newest first

        if (!posts || posts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No posts found for this user',
                data: []
            });
        }

        res.status(200).json({
            success: true,
            count: posts.length,
            data: posts
        });

    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user posts'
        });
    }
};

const updatePost = async (req, res) => {
    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid post ID'
            });
        }

        // Validate required fields
        if (!req.body.title || !req.body.content) {
            return res.status(400).json({
                success: false,
                error: 'Title and content are required'
            });
        }

        const updatedPost = await Post.findOneAndUpdate(
            { 
                _id: req.params.id,
                authorId: req.user.userId // Ensure only author can update
            },
            { 
                title: req.body.title,
                content: req.body.content,
                image: req.body.image,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({
                success: false,
                error: 'Post not found or you are not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedPost
        });

    } catch (error) {
        handleError(res, error, 'Failed to update post');
    }
};

const deletePost = async (req, res) => {
    try {
        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid post ID'
            });
        }

        const deletedPost = await Post.findOneAndDelete({
            _id: req.params.id,
            authorId: req.user.userId // Ensure only author can delete
        });

        if (!deletedPost) {
            return res.status(404).json({
                success: false,
                error: 'Post not found or you are not authorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        handleError(res, error, 'Failed to delete post');
    }
};

export { createPost, getAllPosts, getPostsByUserId, updatePost, deletePost };