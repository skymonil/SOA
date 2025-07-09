require('dotenv').config({})
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./utils/errorHandler')
const mediaRoutes= require('./routes/MediaRoutes')
const logger = require('./utils/Logger')
const {connectRabbitMQ,consumeEvent,publishEvent}= require('./utils/rabbitmq')
const handlePostDeleted = require('./eventHandlers/media-event-handlers')

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
async function startServer() {
  try {
    await connectRabbitMQ()
    app.listen(PORT,()=>{
    logger.info(`Media Service is running on ${PORT}`)
})

//Consume All Events
await consumeEvent('post.deleted',handlePostDeleted)

  } catch (error) {
     logger.error(`Error connecting to Rabbit mq`,error)
     process.exit(1)
  }
}
startServer()
app.use(errorHandler)



 process.on('unhandledRejection', (reason, promise) =>{
    logger.warn("Unhandled Rejection at", promise, "reason", reason)
 })
