const httpStatus = require('../utils/httpStatus');
const AppError = require('../utils/AppError');
const logger = require('./logger.middleware');
const env = require('../config/env');

const prismaErrors = {
  P2002: { status: httpStatus.CONFLICT, message: 'Ya existe un registro con esos datos (valor duplicado)' },
  P2003: { status: httpStatus.CONFLICT, message: 'No se puede eliminar/modificar: el registro está referenciado' },
  P2025: { status: httpStatus.NOT_FOUND, message: 'No se encontró el registro solicitado' }
};

const postgresErrors = {
  '23505': { status: httpStatus.CONFLICT, message: 'Ya existe un registro con esos datos (valor duplicado)' },
  '23503': { status: httpStatus.CONFLICT, message: 'No se puede eliminar/modificar: el registro está referenciado' },
  '22P02': { status: httpStatus.BAD_REQUEST, message: 'Uno de los valores enviados tiene un formato inválido' },
  '23502': { status: httpStatus.BAD_REQUEST, message: 'Falta un valor obligatorio' },
  '23514': { status: httpStatus.BAD_REQUEST, message: 'Uno de los valores no cumple la restricción permitida' }
};

// Patrón: Chain of Responsibility (eslabón final de la cadena de middlewares)
const errorHandler = (error, req, res, next) => {
  let status = httpStatus.INTERNAL_SERVER_ERROR;
  let message = env.isProduction ? 'Error interno del servidor' : error.message || 'Error interno del servidor';
  let errors = [];

  if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
    errors = error.errors;
  } else if (Number.isInteger(error.statusCode)) {
    status = error.statusCode;
    message = error.message;
  } else if (prismaErrors[error.code]) {
    status = prismaErrors[error.code].status;
    message = prismaErrors[error.code].message;
  } else if (postgresErrors[error.code]) {
    status = postgresErrors[error.code].status;
    message = postgresErrors[error.code].message;
  } else if (error instanceof SyntaxError && error.status === httpStatus.BAD_REQUEST) {
    status = httpStatus.BAD_REQUEST;
    message = 'JSON malformado en el cuerpo de la petición';
  } else if (/^\d{5}$/.test(String(error.code || ''))) {
    message = env.isProduction ? 'Error de base de datos' : `Error de base de datos: ${error.message}`;
  }

  if (status >= httpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(`${req.method} ${req.originalUrl} -> ${status}: ${error.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${message}`);
  }

  if (res.headersSent) return next(error);

  const response = { success: false, message };
  if (errors.length > 0) response.errors = errors;
  if (!env.isProduction && status >= httpStatus.INTERNAL_SERVER_ERROR) {
    response.stack = error.stack;
  }

  return res.status(status).json(response);
};

module.exports = errorHandler;
