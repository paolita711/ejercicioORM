const buildChain = require('../chain/buildChain');
const RequiredFieldsHandler = require('./RequiredFieldsHandler');
const TypeHandler = require('./TypeHandler');
const RangeHandler = require('./RangeHandler');

const loginChain = buildChain(
  new RequiredFieldsHandler(['email', 'password']),
  new TypeHandler({ email: 'string', password: 'string' }),
  new RangeHandler({ password: { minLength: 6 } })
);

const registerChain = buildChain(
  new RequiredFieldsHandler(['nombre', 'email', 'password']),
  new TypeHandler({ nombre: 'string', email: 'string', password: 'string', rol: 'string' }),
  new RangeHandler({
    nombre: { minLength: 2, maxLength: 100 },
    password: { minLength: 6 },
    email: { maxLength: 150 }
  })
);

const ejecutarCadena = (chain) => (req, res, next) => {
  try {
    chain.handle(req);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateLogin: ejecutarCadena(loginChain),
  validateRegister: ejecutarCadena(registerChain)
};
