const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginRules, registerRules } = require('../middlewares/validate');

// Web Views
router.get('/login', authController.renderLogin);
router.get('/registrar', authController.renderRegister);

// API Endpoints
router.post('/api/auth/register', registerRules, authController.register);
router.post('/api/auth/login', loginRules, authController.login);
router.post('/api/auth/refresh', authController.refresh);
router.post('/api/auth/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
