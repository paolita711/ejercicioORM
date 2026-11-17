const Producto = require('../../models/Producto');
const AppError = require('../../utils/AppError');
const buildChain = require('../chain/buildChain');
const ValidationHandler = require('./ValidationHandler');
const RequiredFieldsHandler = require('./RequiredFieldsHandler');
const TypeHandler = require('./TypeHandler');
const RangeHandler = require('./RangeHandler');

const TYPE_SCHEMA = Object.freeze({
  nombre: 'string',
  descripcion: 'string',
  precio: 'number',
  stock: 'integer',
  categoria: 'string',
  activo: 'boolean'
});

const RANGE_RULES = Object.freeze({
  nombre: { minLength: 2, maxLength: 150 },
  precio: { min: 0 },
  stock: { min: 0 },
  categoria: { maxLength: 100 }
});

class IdHandler extends ValidationHandler {
  handle(req) {
    const raw = req.params.id;
    if (!/^\d+$/.test(String(raw)) || Number(raw) <= 0) {
      this.fail([{ field: 'id', message: 'Debe ser un entero positivo' }], 'Parámetro id inválido');
    }
    req.params.id = Number(raw);
    return super.handle(req);
  }
}

// Patrón: Chain of Responsibility (cadenas concretas de validación de Producto)
function validateProducto(mode = 'create') {
  const esParcial = mode === 'patch';
  const required = new RequiredFieldsHandler(
    esParcial ? Producto.attributes : Producto.required,
    { requireAll: !esParcial }
  );
  const chain = buildChain(
    required,
    new TypeHandler(TYPE_SCHEMA),
    new RangeHandler(RANGE_RULES)
  );

  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw AppError.badRequest('El cuerpo de la petición debe ser un objeto JSON', [
          { field: 'body', message: 'Se esperaba un objeto JSON' }
        ]);
      }
      chain.handle(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

const validateIdParam = (req, res, next) => {
  try {
    buildChain(new IdHandler()).handle(req);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateProducto, validateIdParam };
