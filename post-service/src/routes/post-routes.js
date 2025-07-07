const express = require('express')
const {createPost, getAllPosts,getPost, deletePost}  = require('../controllers/post-controller')
const { authenticateRequest } = require('../middleware/authMiddleware')
const { create } = require('../models/Post')

//middleware -> This will thel if the user is authorized or not
const router=express()

router.use(authenticateRequest)

router.post('/create-post', createPost);
router.get('/all-posts', getAllPosts);
router.get('/:id', getPost);
router.delete('/:id', deletePost);

module.exports = router;

