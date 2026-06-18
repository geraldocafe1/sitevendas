const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/carrinho', cartController.renderCart);
router.post('/api/cart/validate', cartController.validateCartAPI);

module.exports = router;
