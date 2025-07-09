const express = require('express')  
const multer = require('multer')
const logger = require('../utils/Logger')
const {uploadMedia,getAllMedia }= require('../controllers/MediaContoller')
const {authenticateRequest} = require('../middleware/authMiddleware')
const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5*1024*1024
    }
}).single('file')

router.post('/upload',authenticateRequest,(req,res,next) =>{
    logger.info(`/upload Endpoint hit ...`)
    upload(req,res,function(err){

        if(err instanceof multer.MulterError){
            logger.error('Multer error while uploading',err)
            return res.status(400).json({
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
        else if (err){
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
router.get('/get',authenticateRequest,getAllMedia)

module.exports= router