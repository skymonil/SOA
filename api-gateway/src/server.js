require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const {rateLimit}    = require('express-rate-limit')
const {RedisStore}    = require('rate-limit-redis')
const Redis = require('ioredis')
const { logger,getCallerLocation } = require('./utils/Logger') // Destructure the 'logger' property from the exported object
const proxy = require('express-http-proxy')
const errorHandler = require('./middleware/errorhandler')
const { validate } = require('../../post-service/src/models/Post')
const { validateToken } = require('./middleware/authMiddleware')
const app = express()   
const PORT= process.env.PORT || 3000

const redisClient= new Redis(process.env.REDIS_URL)
app.use(helmet())
app.use(cors())
app.use(express.json())

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 100, // limit each IP to 50 requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests on sensitive endpoint',
    });
  },
  store: new RedisStore({
    sendCommand : (...args) => redisClient.call(...args)
  })
});

app.use(sensitiveLimiter);


// Logging requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  next();
});

const proxyOptions = {
    proxyReqPathResolver : (req) => {
        return req.originalUrl.replace(/^\/v1/,"/api")
    },
     proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: `Internal server error`,
      error: err.message,
    });
    },
}

//setting up proxy for our identity service

app.use((req, res, next) => {
  req.redisClient = redisClient; // 👈 this line is required
  next();
});

app.use(
  "/v1/auth",
  proxy(process.env.AUTH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        ` [${getCallerLocation()}]  Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);



//setting up proxy for our Post service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        ` [${getCallerLocation()}] Response received from Post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
  })
);

//setting up proxy for our Media Service
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
     proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
          proxyReqOpts.headers["Content-Type"] = "application/json";
      }
     

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        ` [${getCallerLocation()}] Response received from Media service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
    parseReqBody: false
  })
);

app.use(errorHandler);

app.listen(PORT,()=>{
    logger.info(`API gateway is running on PORT ${PORT}`)
    logger.info(`auth-service is running on PORT ${process.env.AUTH_SERVICE_URL}`)
    logger.info(`post-service is running on PORT ${process.env.POST_SERVICE_URL}`)
    logger.info(`media-service is running on PORT ${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`Redis URL ${process.env.REDIS_URL}`)

    
})
