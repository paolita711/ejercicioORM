const AppError = require('../utils/AppError');

class BaseRepository {
  constructor({ model, columns }) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository es abstracto y no debe instanciarse directamente');
    }
    if (new.target.instance) return new.target.instance;

    this.model = model;
    this.delegate = model.delegate;
    this.columns = Object.freeze([...columns]);

    new.target.instance = this;
  }

  filterFields(data = {}) {
    const filtered = {};
    for (const column of this.columns) {
      if (Object.prototype.hasOwnProperty.call(data, column)) {
        filtered[column] = data[column];
      }
    }
    return filtered;
  }

  buildData(data) {
    const fields = this.filterFields(data);
    if (Object.keys(fields).length === 0) {
      throw AppError.badRequest('No se proporcionaron campos válidos');
    }
    return fields;
  }

  noEncontrado(error) {
    return error && error.code === 'P2025';
  }

  // Patrón: Repository (Prisma es el único acceso a datos; sin SQL en capas superiores)
  async findAll({ limit = 100, offset = 0 } = {}) {
    const rows = await this.delegate.findMany({
      orderBy: { id: 'asc' },
      take: limit,
      skip: offset
    });
    return rows.map((row) => this.model.toJSON(row));
  }

  async findById(id) {
    const row = await this.delegate.findUnique({ where: { id } });
    return row ? this.model.toJSON(row) : null;
  }

  async create(data) {
    const row = await this.delegate.create({ data: this.buildData(data) });
    return this.model.toJSON(row);
  }

  async update(id, data) {
    try {
      const row = await this.delegate.update({
        where: { id },
        data: this.buildData(data)
      });
      return this.model.toJSON(row);
    } catch (error) {
      if (this.noEncontrado(error)) return null;
      throw error;
    }
  }

  async partialUpdate(id, data) {
    return this.update(id, data);
  }

  async delete(id) {
    try {
      const row = await this.delegate.delete({ where: { id } });
      return this.model.toJSON(row);
    } catch (error) {
      if (this.noEncontrado(error)) return null;
      throw error;
    }
  }

  async count() {
    return this.delegate.count();
  }
}

module.exports = BaseRepository;
