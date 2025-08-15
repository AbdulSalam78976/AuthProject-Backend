import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Please add content"],
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String, // Stores URL of the image (optional)
      default: null,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt automatically
);

const Post = mongoose.model("Post", postSchema);
export default Post;