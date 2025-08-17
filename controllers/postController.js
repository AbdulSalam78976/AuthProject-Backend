

const createPost = (req, res) => {
    
    const { title, content,image } = req.body;
    const post = new Post({ title, content,image, authorId: req.user.userId });
    post.save()
        .then(savedPost => {
            res.status(201).json(savedPost);
        })
        .catch(error => {
            res.status(500).json({ error: 'Failed to create post' });
        });
};