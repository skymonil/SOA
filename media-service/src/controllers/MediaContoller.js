const logger = require('../utils/Logger')
const {uploadToCloudinary}= require('../utils/Cloudinary')
const Media = require('../models/Media')
const uploadMedia = async(req,res)=>{
    logger.info("starting media upload")
    try {
        console.log(req.file)
        if(!req.file){
            logger.error("No file found. Please add a file ")
            return res.status(400).json({
                success: false,
                message: "No file found. Add a file and try again"
            })
        }
        const {originalname,mimetype}   = req.file
        const userId = req.user.userId
        logger.info(`File Details: name=${originalname}, type=${mimetype}`)
        logger.info("uploading to cloudinary Starting ...")

        const cloudinaryUploadResult = await uploadToCloudinary(req.file)
        logger.info(`Cloudinary upload successful. Public id -${cloudinaryUploadResult.public_id}`)

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUploadResult.secure_url,
            userId
        })
        await newlyCreatedMedia.save()
        res.status(201).json({
            success: true,
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url,
        })
    } catch (error) {
        logger.error(`Error uploading to cloudinary`,error)
        res.status(500).json({
            success: false,
            message:"Error uploading to cloudinary"
        })
    }
}

module.exports={uploadMedia}