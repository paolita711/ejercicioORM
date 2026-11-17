const express = require('express');
const ProductoController = require('../controllers/ProductoController');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const paginationMiddleware = require('../middlewares/pagination.middleware');
const { validateProducto, validateIdParam } = require('../middlewares/validation/productoValidators');

const router = express.Router();

router.get('/', authenticate, paginationMiddleware, ProductoController.listar);
router.get('/:id', authenticate, validateIdParam, ProductoController.obtener);
router.post('/', authorize('admin', 'editor'), validateProducto('create'), ProductoController.crear);
router.put('/:id', authorize('admin', 'editor'), validateIdParam, validateProducto('replace'), ProductoController.reemplazar);
router.patch('/:id', authorize('admin', 'editor'), validateIdParam, validateProducto('patch'), ProductoController.actualizarParcial);
router.delete('/:id', authorize('admin'), validateIdParam, ProductoController.eliminar);

module.exports = router;
