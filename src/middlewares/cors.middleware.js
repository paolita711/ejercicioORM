const cors = require('cors');
const env = require('../config/env');
const httpStatus = require('../utils/httpStatus');

// Patrón: Chain of Responsibility (middleware transversal de CORS)
const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error(`Origen no permitido por CORS: ${origin}`);
    error.statusCode = httpStatus.FORBIDDEN;
    return callback(error, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
});

module.exports = corsMiddleware;
