const Handler = require('../chain/Handler');

class ValidationHandler extends Handler {
  hasValue(value) {
    return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
  }
}

module.exports = ValidationHandler;
