const Media = require('../models/Media')
const { deleteMediaFromCloudinary } = require('../utils/Cloudinary')
const logger = require('../utils/Logger')
const handlePostDeleted = async(event)=>{
 console.log(event,'Eventevent')   

 const {postId,mediaIds} =event

 try {
    const mediaToDelete = await Media.find({_id:{$in: mediaIds}})

    for(const media of mediaToDelete){
        await deleteMediaFromCloudinary(media.publicId)
        await Media.findByIdAndDelete(media._id)

        logger.info(`Deleted media ${media._id} asscoiated with this deleted post`)
    }

    logger.info(`Processed deletion of post id ${postId}`)
 } catch (error) {
    logger.error(error,'Error occured while media deletion')
 }
}


module.exports=handlePostDeleted