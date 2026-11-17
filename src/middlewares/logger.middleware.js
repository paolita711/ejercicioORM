const winston = require('winston');
const morgan = require('morgan');
const env = require('../config/env');

const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [new winston.transports.Console()]
});

const stream = { write: (message) => logger.info(message.trim()) };

// Patrón: Chain of Responsibility (middleware de log: método, URL, estado, tiempo e IP; sin body ni tokens)
logger.requestLogger = morgan(
  (tokens, req, res) =>
    [
      tokens['remote-addr'](req, res),
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      `${tokens['response-time'](req, res)} ms`
    ].join(' '),
  { stream }
);
logger.stream = stream;

module.exports = logger;
