const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const required = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_ROUNDS'
];

const missing = required.filter((key) => process.env[key] === undefined || process.env[key] === '');
if (missing.length > 0) {
  throw new Error(`Variables de entorno faltantes o vacías: ${missing.join(', ')}. Revisa el archivo .env`);
}

const port = Number(process.env.PORT);
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT debe ser un entero entre 1 y 65535');
}
if (!/^postgresql:\/\//.test(process.env.DATABASE_URL)) {
  throw new Error('DATABASE_URL debe ser una URL de PostgreSQL (postgresql://...)');
}
if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10) {
  throw new Error('BCRYPT_ROUNDS debe ser un entero mayor o igual a 10');
}

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  bcryptRounds,
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
});
