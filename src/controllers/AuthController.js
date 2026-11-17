const httpStatus = require('../utils/httpStatus');
const asyncHandler = require('../utils/asyncHandler');
const AuthService = require('../services/AuthService');

// CAPA DE PRESENTACIÓN (Controlador MVC de autenticación)
const register = async (req, res) => {
  const usuario = await AuthService.registrar(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Usuario registrado correctamente',
    data: usuario
  });
};

const login = async (req, res) => {
  const data = await AuthService.login(req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Inicio de sesión correcto',
    data
  });
};

module.exports = {
  register: asyncHandler(register),
  login: asyncHandler(login)
};
