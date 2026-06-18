const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { couponValidateRules } = require('../middlewares/validate');

router.get('/checkout', checkoutController.renderCheckout);
router.post('/api/coupons/validate', couponValidateRules, checkoutController.validateCouponAPI);
router.get('/api/cep/:cep', checkoutController.lookupCEPAPI);

module.exports = router;
