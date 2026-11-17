const database = require('./database');

class Producto {
  constructor(db) {
    if (Producto.instance) return Producto.instance;
    if (!db) throw new Error('Producto requiere la instancia de Database');

    // Patrón: Singleton + Modelo (entidad y definición de atributos)
    this.database = db;
    this.delegate = db.client.producto;
    this.tableName = 'productos';
    this.attributes = Object.freeze([
      'nombre',
      'descripcion',
      'precio',
      'stock',
      'categoria',
      'activo'
    ]);
    this.required = Object.freeze(['nombre', 'precio', 'stock']);
    this.hidden = Object.freeze([]);

    Producto.instance = this;
  }

  toJSON(row) {
    if (!row) return null;
    const result = { ...row };
    if (result.precio !== undefined && result.precio !== null) {
      result.precio = Number(result.precio);
    }
    this.hidden.forEach((field) => delete result[field]);
    return result;
  }
}

module.exports = new Producto(database);
