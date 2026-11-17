const database = require('./database');

class Usuario {
  constructor(db) {
    if (Usuario.instance) return Usuario.instance;
    if (!db) throw new Error('Usuario requiere la instancia de Database');

    // Patrón: Singleton + Modelo (entidad y definición de atributos)
    this.database = db;
    this.delegate = db.client.usuario;
    this.tableName = 'usuarios';
    this.attributes = Object.freeze(['nombre', 'email', 'password', 'rol']);
    this.roles = Object.freeze(['admin', 'editor', 'lector']);
    this.hidden = Object.freeze(['password']);

    Usuario.instance = this;
  }

  toJSON(row) {
    if (!row) return null;
    const result = { ...row };
    this.hidden.forEach((field) => delete result[field]);
    return result;
  }
}

module.exports = new Usuario(database);
