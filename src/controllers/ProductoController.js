const httpStatus = require('../utils/httpStatus');
const asyncHandler = require('../utils/asyncHandler');
const ProductoService = require('../services/ProductoService');

// CAPA DE PRESENTACIÓN (Controlador MVC: solo HTTP, sin SQL ni lógica de negocio)
const listar = async (req, res) => {
  const { productos, pagination } = await ProductoService.listar(req.pagination);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Productos obtenidos correctamente',
    data: productos,
    pagination
  });
};

const obtener = async (req, res) => {
  const producto = await ProductoService.obtenerPorId(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Producto obtenido correctamente',
    data: producto
  });
};

const crear = async (req, res) => {
  const producto = await ProductoService.crear(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Producto creado correctamente',
    data: producto
  });
};

const reemplazar = async (req, res) => {
  const producto = await ProductoService.reemplazar(req.params.id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Producto reemplazado correctamente',
    data: producto
  });
};

const actualizarParcial = async (req, res) => {
  const producto = await ProductoService.actualizarParcial(req.params.id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Producto actualizado correctamente',
    data: producto
  });
};

const eliminar = async (req, res) => {
  const producto = await ProductoService.eliminar(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    message: 'Producto eliminado correctamente',
    data: producto
  });
};

module.exports = {
  listar: asyncHandler(listar),
  obtener: asyncHandler(obtener),
  crear: asyncHandler(crear),
  reemplazar: asyncHandler(reemplazar),
  actualizarParcial: asyncHandler(actualizarParcial),
  eliminar: asyncHandler(eliminar)
};
