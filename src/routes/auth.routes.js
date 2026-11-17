const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validateRegister, validateLogin } = require('../middlewares/validation/authValidators');
const { hashPasswordMiddleware } = require('../middlewares/hash.middleware');

const router = express.Router();

router.post('/register', validateRegister, hashPasswordMiddleware, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

module.exports = router;
