const { error } = require('winston');
const Post = require('../models/Post');
const logger = require('../utils/Logger');
const { validateCreatePost } = require('../../../auth-service/src/utils/validation');

const createPost = async(req,res,)=>{
    try {
      logger.info("createPost endpoint hit ...")
      const {error} = validateCreatePost(req.body)
      if(error){
         logger.warn('Validation error',error.details[0].message)
     return   res.status(400).json({
        success: false,
        message: error.details[0].message   
      })
   }
       const {content, mediaUrls} = req.body
       const newlyCreatePost = new Post({
        user: req.user.userId,
        content,
        mediaUrls: mediaUrls || []
       })
       await newlyCreatePost.save()
       res.status(201).json({
        success: true,
        message: "Post creation success"    
       })
      
    } catch (error) {
         logger.error(`Error creating Post`,error);
         res.status(500).json({
            success: false,
            message: "Error creating Post"
         })
    }
}

const getAllPosts = async(req,res,)=>{
    try {
       const page = parseInt(req.query.page) || 1;
       const limit = parseInt(req.query.limit) || 10;
       const startIndex = (page -1) * limit

       const cacheKey = `posts: ${page}: ${limit}`
       const cachedPosts= await req.redisClient.get(cacheKey)

       if(cachedPosts){
         return res.json(JSON.parse(cachedPosts))

       }

       const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit)

       const totalPosts =await Post.countDocuments()
       const result = {
         posts,
         currentPage: page,
         totalPages: Math.ceil(totalPosts/limit),
         totalPosts: totalPosts
       }
    } catch (error) {
         logger.error(`Error getting all Post`,error);
         res.status(500).json({
            success: false,
            message: "Error getting all Post"
         })
    }
}
const getPost = async(req,res,)=>{
    try {
       
    } catch (error) {
         logger.error(`Error fetching  Post by ID`,error);
         res.status(500).json({
            success: false,
            message: "Error fetching  Post by ID"
         })
    }
}

const deletePost = async(req,res,)=>{
    try {
       
    } catch (error) {
         logger.error(`Error deleting  Post by ID`,error);
         res.status(500).json({
            success: false,
            message: "Error deleting  Post by ID"
         })
    }
}

module.exports = {createPost,}