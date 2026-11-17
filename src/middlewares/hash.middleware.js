const bcrypt = require('bcrypt');
const env = require('../config/env');

const hashPassword = (password) => bcrypt.hash(password, env.bcryptRounds);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

// Patrón: Chain of Responsibility (middleware que hashea la contraseña antes de guardarla)
const hashPasswordMiddleware = async (req, res, next) => {
  try {
    if (req.body && req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { hashPassword, comparePassword, hashPasswordMiddleware };
