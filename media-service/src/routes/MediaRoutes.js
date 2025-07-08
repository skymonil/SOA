const express = require('express')  
const multer = require('multer')

const {uploadMedia }= require('../controllers/MediaContoller')
const {authenticateRequest} = require('../middleware/authMiddleware')


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5*1024*1024
    }
}).single('file')

router.post('./upload',authenticateRequest,(req,res,next) =>{
    upload(req,res,function(error){
        if(err instanceof multer.MulterError){
            logger.error('Multer error while uploading',err)
            return res.status(400).json({
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
        else if (error){
             logger.error('Multer error while uploading',err)
            return res.status(500).json({
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
        if(!req.file){
             return res.status(400).json({
                message: "No file found",
                error: err.message,
                stack: err.stack
            })
        }
        next()
    })
}, uploadMedia)

module.exports= routes