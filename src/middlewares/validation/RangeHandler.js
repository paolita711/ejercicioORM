const ValidationHandler = require('./ValidationHandler');

class RangeHandler extends ValidationHandler {
  constructor(rules, { source = 'body' } = {}) {
    super();
    this.rules = rules;
    this.source = source;
  }

  handle(req) {
    const data = req[this.source] || {};
    const errors = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      if (!this.hasValue(data[field])) continue;
      const value = data[field];

      if (rule.minLength !== undefined && String(value).length < rule.minLength) {
        errors.push({ field, message: `Debe tener al menos ${rule.minLength} caracteres` });
      }
      if (rule.maxLength !== undefined && String(value).length > rule.maxLength) {
        errors.push({ field, message: `No debe superar los ${rule.maxLength} caracteres` });
      }
      if (rule.min !== undefined && value < rule.min) {
        errors.push({ field, message: `Debe ser mayor o igual a ${rule.min}` });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({ field, message: `Debe ser menor o igual a ${rule.max}` });
      }
    }

    if (errors.length > 0) this.fail(errors);
    return super.handle(req);
  }
}

module.exports = RangeHandler;
