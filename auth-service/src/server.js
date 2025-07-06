const { default: mongoose } = require('mongoose');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit } = require('express-rate-limit');
const Redis = require('ioredis');
require('dotenv').config();
const express = require('express');
const { default: RedisStore }= require('rate-limit-redis')
const app = express();
const routes = require('./routes/auth-service')
// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
const errorhandler = require('./middleware/errorhandler');
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((e) => logger.error('MongoDB connection error', e));

// Redis client setup
const redisClient = new Redis(process.env.REDIS_URL);

// Logging requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  next();
});

//  Composite key function for rate limiter
const generateRateLimitKey = (req) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const session = req.headers['x-session-id'] || 'no-session'; // optional
  return `${ip}-${userAgent}-${session}`;
};

//  General DDoS protection using composite key
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // 10 requests
  duration: 1, // per second
});

app.use(async (req, res, next) => {
  const key = generateRateLimitKey(req);
  try {
    await rateLimiter.consume(key);
    next();
  } catch (e) {
    logger.warn(`Rate limit exceeded for key: ${key}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests – please slow down.',
    });
  }
});

// Sensitive endpoints limiter (IP-based fallback)
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 50, // limit each IP to 50 requests
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

// Example usage of sensitive limiter
 app.use('/api/auth/register', sensitiveEndpointsLimiter);



 //Rotues

 app.use('/api/auth',routes)

const PORT= process.env.PORT
 //error handler

 app.use(errorhandler)
 app.listen(PORT, ()=>{
    logger.info(`Auth Service is running on port ${process.env.PORT}`)
 })


 process.on('unhandledRejection', (reason, promise) =>{
    logger.warn("Unhandled Rejection at", promise, "reason", reason)
 })
