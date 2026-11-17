const express = require('express');
const authRoutes = require('./auth.routes');
const productoRoutes = require('./producto.routes');
const HealthController = require('../controllers/HealthController');

// Router principal: monta todos los routers bajo /api
const router = express.Router();

router.get('/health', HealthController.check);
router.use('/auth', authRoutes);
router.use('/Productos', productoRoutes);

module.exports = router;
