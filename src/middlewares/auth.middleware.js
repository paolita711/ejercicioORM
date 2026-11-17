const AppError = require('../utils/AppError');
const AuthService = require('../services/AuthService');

// Patrón: Chain of Responsibility (autenticación JWT y autorización por roles)
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Se requiere un token Bearer válido'));
  }

  try {
    req.user = AuthService.verificarToken(token);
    return next();
  } catch (error) {
    return next(AppError.unauthorized('Token inválido o expirado'));
  }
};

const authorize = (...roles) => (req, res, next) =>
  authenticate(req, res, (error) => {
    if (error) return next(error);
    if (roles.length > 0 && !roles.includes(req.user.rol)) {
      return next(AppError.forbidden(`Rol insuficiente: se requiere ${roles.join(' o ')}`));
    }
    return next();
  });

module.exports = { authenticate, authorize };
