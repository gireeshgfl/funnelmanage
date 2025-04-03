let logger;

if (process.env.NEXT_RUNTIME === 'edge') {
  logger = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    http: console.log,
    verbose: console.log,
    debug: console.debug,
    silly: console.log,
  };
} else {
  const winston = require('winston');
  
  const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  };

  logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'silly',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });
}

export default logger;
