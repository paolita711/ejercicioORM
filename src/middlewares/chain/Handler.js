const AppError = require('../../utils/AppError');
const httpStatus = require('../../utils/httpStatus');

// Patrón: Chain of Responsibility (handler base)
class Handler {
  constructor() {
    this.next = null;
  }

  setNext(handler) {
    this.next = handler;
    return handler;
  }

  handle(req) {
    if (this.next) return this.next.handle(req);
    return null;
  }

  fail(errors, message = 'Error de validación') {
    throw new AppError(message, httpStatus.BAD_REQUEST, errors);
  }
}

module.exports = Handler;
