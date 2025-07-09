const Post = require('../models/Post');
const {logger,getCallerLocation} = require('../utils/Logger');
const { validateCreatePost } = require('../../../auth-service/src/utils/validation');
const { post } = require('../routes/post-routes');
const { publishEvent } = require('../utils/rabbitmq');

async function invalidatePostCache(req,input) {
   const cachedKey = `post:${input}`
   await req.redisClient.del(cachedKey)
   const keys = await req.redisClient.keys("posts:*")
   if(keys.length > 0){
      await req.redisClient.del(keys)
   }
}

const createPost = async(req,res,)=>{
    try {
      logger.info("createPost endpoint hit ...")
      const {error: validationResultError} = validateCreatePost(req.body);
        if(validationResultError){
            logger.warn('Validation error', validationResultError.details[0].message);
            return res.status(400).json({
                success: false,
                message: validationResultError.details[0].message
            });
        }
     
       const {content, mediaIds} = req.body
       const newlyCreatePost = new Post({
        user: req.user.userId,
        content,
        mediaIds: mediaIds || []
       })
       await newlyCreatePost.save()
       await invalidatePostCache(req,newlyCreatePost._id.toString())
       res.status(201).json({
        success: true,
        message: "Post creation success"    
       })
      
    } catch (e) {
         logger.error(`Error creating Post`,e);
         res.status(500).json({
            success: false,
            message: "Error creating Post"
         })
    }
}

const getAllPosts = async(req,res,)=>{
    try {
      logger.info(`getAllPosts endpoint hit ..`)
       const page = parseInt(req.query.page) || 1;
       const limit = parseInt(req.query.limit) || 10;
       const startIndex = (page -1) * limit

       const cacheKey = `posts: ${page}: ${limit}`
       const cachedPosts= await req.redisClient.get(cacheKey)

       if(cachedPosts){
           logger.info(`Cache hit for key: ${cacheKey}`);
      return res.json(JSON.parse(cachedPosts));

       }
  logger.info(`Cache miss. Fetching posts from DB...`);
       const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit)

       const totalPosts =await Post.countDocuments()
       const result = {
         posts,
         currentPage: page,
         totalPages: Math.ceil(totalPosts/limit),
         totalPosts: totalPosts
       }

   try {
      await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    } catch (e) {
      logger.warn('Redis SETEX failed', e);
    }

     return res.json(result);
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
       const postId = req.params.id;
       const cacheKey = `post:${postId}`
       const cachedPost = await req.redisClient.get(cacheKey) 

       if(cachedPost){
         return res.json(JSON.parse(cachedPost))
       }

       const singlePostDetailsbyId = await Post.findById(postId)
if(!singlePostDetailsbyId){
   return res.status(404).json({
      success: false,
      message: "Post not found"
   })
}
await req.redisClient.setex(cachedPost,3600,JSON.stringify(singlePostDetailsbyId))

return res.json(singlePostDetailsbyId)

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
       const post = await Post.findOneAndDelete({
         _id: req.params.id,
         user: req.user.userId
       })
       if(!post){
          return res.status(404).json({
      success: false,
      message: "Post not found"
   })
}

// publish event post delete method ->
await publishEvent('post.deleted',{
   postId: post._id.toString(),
   userId: req.user.userId,
   mediaIds: post.mediaIds
})
await invalidatePostCache(req,req.params.id)
res.json({
   message: "Post deleted Successfully"
})
}

     catch (error) {
         logger.error(`Error deleting  Post by ID`,error);
         res.status(500).json({
            success: false,
            message: "Error deleting  Post by ID"
         })
    }
}

module.exports = {createPost,getAllPosts,getPost,deletePost}