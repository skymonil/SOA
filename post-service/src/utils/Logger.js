const winston = require('winston');
const path = require('path');

// Utility to get the caller location
const getCallerLocation = () => {
  const oldPrepare = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack;
  Error.prepareStackTrace = oldPrepare;

  const caller = stack[3]; // Usually the actual call site
  if (!caller) return 'unknown';

  const file = path.basename(caller.getFileName());
  const line = caller.getLineNumber();
  return `${file}:${line}`;
};

// Custom format that injects location into log record
const addLocationFormat = winston.format((info) => {
  info.location = getCallerLocation();
  return info;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    addLocationFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, location, stack }) => {
      return `${timestamp} [${level.toUpperCase()}] (${location}) ${message}${
        stack ? `\nStack: ${stack}` : ''
      }`;
    })
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.combine(
        addLocationFormat(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: winston.format.combine(
        addLocationFormat(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

module.exports = {logger,getCallerLocation}
