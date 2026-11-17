const BaseRepository = require('./BaseRepository');
const Producto = require('../models/Producto');

// Patrón: Repository + Singleton (único acceso a datos de productos mediante Prisma)
class ProductoRepository extends BaseRepository {
  constructor() {
    super({ model: Producto, columns: Producto.attributes });
  }
}

module.exports = new ProductoRepository();
