const ValidationHandler = require('./ValidationHandler');

class TypeHandler extends ValidationHandler {
  constructor(schema, { source = 'body' } = {}) {
    super();
    this.schema = schema;
    this.source = source;
  }

  normalize(value, type) {
    if ((type === 'number' || type === 'integer') && typeof value === 'string' && value.trim() !== '') {
      const converted = Number(value);
      return Number.isNaN(converted) ? value : converted;
    }
    if (type === 'boolean' && typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return value;
  }

  isValid(value, type) {
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (type === 'integer') return typeof value === 'number' && Number.isInteger(value);
    if (type === 'boolean') return typeof value === 'boolean';
    return true;
  }

  handle(req) {
    const data = req[this.source] || {};
    const errors = [];

    for (const [field, type] of Object.entries(this.schema)) {
      if (!this.hasValue(data[field])) continue;

      const normalized = this.normalize(data[field], type);
      data[field] = normalized;

      if (!this.isValid(normalized, type)) {
        errors.push({
          field,
          message: `Debe ser ${type === 'integer' ? 'un número entero' : type === 'number' ? 'un número' : `de tipo ${type}`}`
        });
      }
    }

    if (errors.length > 0) this.fail(errors);
    return super.handle(req);
  }
}

module.exports = TypeHandler;
