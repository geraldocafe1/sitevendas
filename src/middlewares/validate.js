const { body, validationResult } = require('express-validator');

// Helper to return validation error response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({ errors: errors.array() });
    }
    // For page requests, keep errors in request object to handle in controllers
    req.validationErrors = errors.array();
  }
  next();
};

const loginRules = [
  body('email').isEmail().withMessage('Informe um e-mail válido.'),
  body('password').notEmpty().withMessage('A senha é obrigatória.'),
  validate
];

const registerRules = [
  body('name').trim().notEmpty().withMessage('O nome é obrigatório.'),
  body('email').isEmail().withMessage('Informe um e-mail válido.'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres.'),
  body('phone').trim().notEmpty().withMessage('O telefone é obrigatório.'),
  validate
];

const couponValidateRules = [
  body('code').trim().toUpperCase().notEmpty().withMessage('O código do cupom é obrigatório.'),
  body('cart_total').isFloat({ min: 0 }).withMessage('O valor do carrinho deve ser um número positivo.'),
  validate
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('A nota deve ser entre 1 e 5 estrelas.'),
  body('comment').trim().escape().optional({ nullable: true }),
  validate
];

const checkoutRules = [
  body('shipping_name').trim().notEmpty().withMessage('O nome é obrigatório.'),
  body('shipping_email').isEmail().withMessage('E-mail de entrega inválido.'),
  body('shipping_phone').trim().notEmpty().withMessage('Telefone de contato é obrigatório.'),
  body('shipping_zip').trim().notEmpty().withMessage('O CEP é obrigatório.'),
  body('shipping_address').trim().notEmpty().withMessage('O endereço é obrigatório.'),
  body('shipping_number').trim().notEmpty().withMessage('O número do endereço é obrigatório.'),
  body('shipping_city').trim().notEmpty().withMessage('A cidade é obrigatória.'),
  body('shipping_state').trim().notEmpty().withMessage('O estado é obrigatório.'),
  body('payment_method').isIn(['credit_card', 'pix', 'boleto']).withMessage('Método de pagamento inválido.'),
  
  // Conditionally validate credit card fields if payment method is credit_card
  body('card_number').custom((val, { req }) => {
    if (req.body.payment_method === 'credit_card' && (!val || val.replace(/\s/g, '').length < 13)) {
      throw new Error('Número do cartão inválido.');
    }
    return true;
  }),
  body('card_name').custom((val, { req }) => {
    if (req.body.payment_method === 'credit_card' && (!val || val.trim().length < 3)) {
      throw new Error('Nome impresso no cartão inválido.');
    }
    return true;
  }),
  body('card_expiry').custom((val, { req }) => {
    if (req.body.payment_method === 'credit_card') {
      if (!val || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(val)) {
        throw new Error('Data de validade inválida (MM/AA).');
      }
    }
    return true;
  }),
  body('card_cvv').custom((val, { req }) => {
    if (req.body.payment_method === 'credit_card' && (!val || !/^\d{3,4}$/.test(val))) {
      throw new Error('Código de segurança (CVV) inválido.');
    }
    return true;
  }),
  validate
];

const adminProductRules = [
  body('name').trim().notEmpty().withMessage('O nome do produto é obrigatório.'),
  body('description').trim().notEmpty().withMessage('A descrição do produto é obrigatória.'),
  body('price').isFloat({ min: 0.01 }).withMessage('O preço deve ser maior que zero.'),
  body('compare_price').optional({ checkFalsy: true }).isFloat({ min: 0.01 }).withMessage('O preço promocional deve ser maior que zero.'),
  body('stock').isInt({ min: 0 }).withMessage('O estoque não pode ser negativo.'),
  body('sku').trim().notEmpty().withMessage('SKU é obrigatório.'),
  body('category_id').isUUID().withMessage('Selecione uma categoria válida.'),
  body('weight_kg').isFloat({ min: 0.001 }).withMessage('O peso deve ser maior que zero.'),
  body('meta_title').trim().optional(),
  body('meta_description').trim().optional(),
  validate
];

const adminCouponRules = [
  body('code').trim().toUpperCase().notEmpty().withMessage('O código do cupom é obrigatório.'),
  body('type').isIn(['percent', 'fixed']).withMessage('O tipo de cupom deve ser "percent" ou "fixed".'),
  body('value').isFloat({ min: 0.01 }).withMessage('O valor do cupom deve ser maior que zero.'),
  body('min_order_value').isFloat({ min: 0 }).withMessage('O valor mínimo do pedido não pode ser negativo.'),
  body('max_uses').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('O número máximo de usos deve ser maior que zero.'),
  body('expires_at').optional({ checkFalsy: true }).isISO8601().withMessage('Data de expiração inválida.'),
  validate
];

const adminPostRules = [
  body('title').trim().notEmpty().withMessage('O título é obrigatório.'),
  body('content').trim().notEmpty().withMessage('O conteúdo é obrigatório.'),
  body('excerpt').trim().optional(),
  body('meta_title').trim().optional(),
  body('meta_description').trim().optional(),
  validate
];

module.exports = {
  loginRules,
  registerRules,
  couponValidateRules,
  reviewRules,
  checkoutRules,
  adminProductRules,
  adminCouponRules,
  adminPostRules
};
