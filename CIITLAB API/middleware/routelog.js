const winston = require('winston');

// Kreiranje logger-a sa winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'logs/server.log' }), // Loguje u fajl server.log
    new winston.transports.Console() // Takođe loguje u konzolu
  ]
});

const routeLogger = (req, res, next) => {
  const now = new Date().toISOString();
  logger.info(`[${now}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
};


module.exports = routeLogger;