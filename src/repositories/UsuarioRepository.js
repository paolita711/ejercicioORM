const BaseRepository = require('./BaseRepository');
const Usuario = require('../models/Usuario');

// Patrón: Repository + Singleton (único acceso a datos de usuarios mediante Prisma)
class UsuarioRepository extends BaseRepository {
  constructor() {
    super({ model: Usuario, columns: Usuario.attributes });
  }

  findByEmail(email) {
    return this.delegate.findUnique({ where: { email } });
  }
}

module.exports = new UsuarioRepository();
