const AppError = require('../utils/AppError');
const ProductoRepository = require('../repositories/ProductoRepository');

// CAPA DE NEGOCIO (sin conocer req/res)
class ProductoService {
  constructor(repository) {
    if (ProductoService.instance) return ProductoService.instance;
    this.repository = repository;
    ProductoService.instance = this;
  }

  async listar({ page, limit, offset }) {
    const [productos, total] = await Promise.all([
      this.repository.findAll({ limit, offset }),
      this.repository.count()
    ]);

    return {
      productos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async obtenerPorId(id) {
    const producto = await this.repository.findById(id);
    if (!producto) throw AppError.notFound(`No existe un producto con id ${id}`);
    return producto;
  }

  async crear(data) {
    return this.repository.create(data);
  }

  async reemplazar(id, data) {
    const producto = await this.repository.update(id, data);
    if (!producto) throw AppError.notFound(`No existe un producto con id ${id}`);
    return producto;
  }

  async actualizarParcial(id, data) {
    const producto = await this.repository.partialUpdate(id, data);
    if (!producto) throw AppError.notFound(`No existe un producto con id ${id}`);
    return producto;
  }

  async eliminar(id) {
    const producto = await this.repository.delete(id);
    if (!producto) throw AppError.notFound(`No existe un producto con id ${id}`);
    return producto;
  }
}

module.exports = new ProductoService(ProductoRepository);
