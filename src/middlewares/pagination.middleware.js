const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Patrón: Chain of Responsibility (middleware transversal de paginación)
const paginationMiddleware = (req, res, next) => {
  const page = positiveInteger(req.query.page, 1);
  let limit = positiveInteger(req.query.limit, DEFAULT_LIMIT);
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
};

module.exports = paginationMiddleware;
