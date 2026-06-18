const { Coupon } = require('../models');
const { Op } = require('sequelize');

/**
 * Validates a coupon code against rules and cart total
 * @param {String} code - Coupon code
 * @param {Number} cartSubtotal - Cart subtotal
 * @returns {Promise<Object>} - Validation result: { valid: Boolean, discount: Number, coupon: Object, message: String }
 */
const validateCoupon = async (code, cartSubtotal = 0) => {
  if (!code) {
    return { valid: false, discount: 0, message: 'Nenhum cupom informado.' };
  }

  const coupon = await Coupon.findOne({
    where: {
      code: {
        [Op.like]: code.trim().toUpperCase()
      }
    }
  });

  if (!coupon) {
    return { valid: false, discount: 0, message: 'Cupom inválido ou não existe.' };
  }

  if (!coupon.is_active) {
    return { valid: false, discount: 0, message: 'Este cupom não está mais ativo.' };
  }

  // Check expiration date
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, discount: 0, message: 'Este cupom expirou.' };
  }

  // Check max uses limit
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { valid: false, discount: 0, message: 'Este cupom atingiu o limite de uso.' };
  }

  // Check minimum order value
  const minVal = parseFloat(coupon.min_order_value);
  if (cartSubtotal < minVal) {
    return {
      valid: false,
      discount: 0,
      message: `Este cupom requer um valor mínimo de compra de R$ ${minVal.toFixed(2).replace('.', ',')}.`
    };
  }

  // Calculate discount
  let discount = 0;
  const couponValue = parseFloat(coupon.value);

  if (coupon.type === 'percent') {
    discount = (cartSubtotal * couponValue) / 100;
  } else if (coupon.type === 'fixed') {
    discount = couponValue;
  }

  // Cap discount at the cart total to prevent negative balance
  if (discount > cartSubtotal) {
    discount = cartSubtotal;
  }

  return {
    valid: true,
    discount: parseFloat(discount.toFixed(2)),
    coupon,
    message: 'Cupom aplicado com sucesso!'
  };
};

module.exports = {
  validateCoupon
};
