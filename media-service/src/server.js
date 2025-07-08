require('dotenv').config({})
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./utils/errorHandler')
const mediaRoutes= require('./routes/MediaRoutes')
const logger = require('./utils/Logger')


const app = express()
app.use(cors())
app.use(helmet())
app.use(express.json())
const PORT = process.env.PORT || 3004

//connect to mongodb
mongoose.connect(process.env.MONGODB_URI).then(()=> logger.info('Connected to mongodb')).catch((e)=> logger.error("Mongo Connection Error ",e))

app.use((req ,res ,next)=>{
    logger.info(`Received ${req.method} requuest to ${req.url}`)
    logger.info(`Request body, ${req.body}`)

    next()

})

app.use('/api/media',mediaRoutes)
app.use(errorHandler)

app.listen(PORT,()=>{
    logger.info(`Media Service is running on ${PORT}`)
})


 process.on('unhandledRejection', (reason, promise) =>{
    logger.warn("Unhandled Rejection at", promise, "reason", reason)
 })
