const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { loadUserContext, verifyJWT } = require('../middlewares/auth');
const { checkoutRules } = require('../middlewares/validate');

// Web Views
router.get('/pedidos/confirmado/:id', loadUserContext, orderController.renderOrderSuccess);
router.get('/pedidos/:id', loadUserContext, orderController.renderOrderDetails);

// API Endpoints
router.post('/api/orders', loadUserContext, checkoutRules, orderController.createOrderAPI);
router.get('/api/orders/:id', loadUserContext, orderController.getOrderAPI);

module.exports = router;
