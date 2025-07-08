const cloudinary = require('cloudinary').v2;
const { UploadStream } = require('cloudinary');
const logger = require('./Logger')
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})

const uploadMedia = (file) =>{
    return new Promise((resolve, reject) =>{
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto'
            },
            (error,result) =>{
                if(error){
                    logger.error('Eror while uploading to cloudinary')
                } else{
                    resolve(result)
                }
            }
            
        )
        uploadStream.end(file.buffer)
    }
    
)}


module.exports={uploadMedia}