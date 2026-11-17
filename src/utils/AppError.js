const httpStatus = require('./httpStatus');

class AppError extends Error {
  constructor(message, statusCode = httpStatus.INTERNAL_SERVER_ERROR, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, AppError);
  }

  static badRequest(message, errors = []) {
    return new AppError(message, httpStatus.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Token de autenticación requerido o inválido') {
    return new AppError(message, httpStatus.UNAUTHORIZED);
  }

  static forbidden(message = 'No tienes permisos para realizar esta acción') {
    return new AppError(message, httpStatus.FORBIDDEN);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, httpStatus.NOT_FOUND);
  }

  static conflict(message = 'El recurso ya existe o está referenciado') {
    return new AppError(message, httpStatus.CONFLICT);
  }
}

module.exports = AppError;
