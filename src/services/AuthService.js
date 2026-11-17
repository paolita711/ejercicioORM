const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const Usuario = require('../models/Usuario');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const { comparePassword } = require('../middlewares/hash.middleware');

// CAPA DE NEGOCIO (autenticación y autorización)
class AuthService {
  constructor(repository) {
    if (AuthService.instance) return AuthService.instance;
    this.repository = repository;
    AuthService.instance = this;
  }

  async registrar({ nombre, email, password, rol }) {
    const existente = await this.repository.findByEmail(email);
    if (existente) throw AppError.conflict('Ya existe un usuario con ese email');

    const rolFinal = rol || 'editor';
    if (!Usuario.roles.includes(rolFinal)) {
      throw AppError.badRequest(`El rol debe ser uno de: ${Usuario.roles.join(', ')}`);
    }

    const usuario = await this.repository.create({
      nombre,
      email,
      password,
      rol: rolFinal
    });

    return usuario;
  }

  async login({ email, password }) {
    const usuario = await this.repository.findByEmail(email);
    if (!usuario || !(await comparePassword(password, usuario.password))) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    return {
      token,
      usuario: Usuario.toJSON(usuario)
    };
  }

  verificarToken(token) {
    return jwt.verify(token, env.jwt.secret);
  }
}

module.exports = new AuthService(UsuarioRepository);
