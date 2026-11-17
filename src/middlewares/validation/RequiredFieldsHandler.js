const ValidationHandler = require('./ValidationHandler');

class RequiredFieldsHandler extends ValidationHandler {
  constructor(fields, { requireAll = true, source = 'body' } = {}) {
    super();
    this.fields = fields;
    this.requireAll = requireAll;
    this.source = source;
  }

  handle(req) {
    const data = req[this.source] || {};
    const errors = [];

    if (this.requireAll) {
      for (const field of this.fields) {
        if (!this.hasValue(data[field])) {
          errors.push({ field, message: 'Este campo es obligatorio' });
        }
      }
    } else if (!this.fields.some((field) => this.hasValue(data[field]))) {
      errors.push({
        field: this.source,
        message: `Debe enviar al menos uno de los campos: ${this.fields.join(', ')}`
      });
    }

    if (errors.length > 0) this.fail(errors);
    return super.handle(req);
  }
}

module.exports = RequiredFieldsHandler;
